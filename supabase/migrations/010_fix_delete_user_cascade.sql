-- =====================================================
-- MIGRACIÓN: Permitir borrar usuarios con reservas
-- =====================================================
-- El problema: al borrar un usuario desde Supabase Auth,
-- el perfil se elimina por CASCADE, pero las reservas
-- referencian al perfil SIN CASCADE, causando error.
--
-- Solución: Actualizar las foreign keys para que al
-- eliminar un perfil (y por tanto un usuario), las
-- reservas asociadas también se eliminen.
-- =====================================================

-- 1. Reservas: cambiar FK para CASCADE al borrar perfil
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

ALTER TABLE reservations
ADD CONSTRAINT reservations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- 2. Audit logs: cambiar FK para SET NULL al borrar perfil
--    (Conservamos el log histórico pero sin actor)
ALTER TABLE audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;

ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_actor_id_fkey
FOREIGN KEY (actor_id) REFERENCES profiles(id)
ON DELETE SET NULL;

-- =====================================================
-- FIN
-- =====================================================
