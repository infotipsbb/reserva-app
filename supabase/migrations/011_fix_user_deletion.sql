-- =====================================================
-- DIAGNÓSTICO Y CORRECCIÓN: No se pueden borrar usuarios
-- =====================================================
-- Ejecutar en SQL Editor de Supabase (como usuario postgres/service_role)
-- =====================================================

-- PASO 1: DIAGNÓSTICO — Ver qué constraints existen actualmente
SELECT
  conrelid::regclass AS tabla,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE confrelid IN ('profiles'::regclass, 'auth.users'::regclass)
  AND contype = 'f'
ORDER BY tabla, constraint_name;

-- Si ves que reservations.user_id NO tiene ON DELETE CASCADE,
-- ejecuta los pasos de corrección abajo.

-- =====================================================
-- PASO 2: CORRECCIÓN ROBUSTA — Eliminar TODOS los constraints
-- en reservations.user_id y recrearlos con CASCADE
-- =====================================================

-- Eliminar cualquier constraint existente en reservations.user_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'reservations'::regclass
      AND contype = 'f'
      AND conkey = ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'reservations'::regclass AND attname = 'user_id')
  LOOP
    EXECUTE format('ALTER TABLE reservations DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Eliminado constraint: %', r.conname;
  END LOOP;
END $$;

-- Recrear con ON DELETE CASCADE
ALTER TABLE reservations
ADD CONSTRAINT reservations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- =====================================================
-- PASO 3: FUNCIÓN PARA BORRAR USUARIO COMPLETAMENTE
-- =====================================================
-- Uso: SELECT delete_user_complete('uuid-del-usuario');
-- =====================================================

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  profile_count INT;
  reservation_count INT;
BEGIN
  -- Contar reservas del usuario
  SELECT COUNT(*) INTO reservation_count
  FROM reservations
  WHERE user_id = target_user_id;

  -- Contar perfil del usuario
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE id = target_user_id;

  -- 1. Borrar reservas primero (si no hay CASCADE aún)
  DELETE FROM reservations WHERE user_id = target_user_id;

  -- 2. Borrar perfil
  DELETE FROM profiles WHERE id = target_user_id;

  -- 3. Borrar usuario de auth.users
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN format('Usuario %s eliminado. Perfiles: %s, Reservas: %s borradas.',
    target_user_id, profile_count, reservation_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EJEMPLO DE USO (descomenta para ejecutar):
-- =====================================================
-- SELECT delete_user_complete('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
