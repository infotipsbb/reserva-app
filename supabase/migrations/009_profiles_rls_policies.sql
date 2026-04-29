-- =====================================================
-- MIGRACIÓN: Políticas RLS para tabla profiles
-- =====================================================
-- Permite a los usuarios autenticados gestionar su propio
-- perfil sin depender de Service Role Key.
-- =====================================================

-- Usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuarios pueden crear su propio perfil (fallback si el trigger falla)
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
