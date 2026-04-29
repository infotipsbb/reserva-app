-- =====================================================
-- FIX: Agregar políticas RLS faltantes para tabla courts
-- Esto permite que los admins editen precios desde el panel
-- =====================================================

-- 1. Política UPDATE: Admins pueden actualizar canchas (precios, activar/desactivar)
DROP POLICY IF EXISTS "Admins actualizan canchas" ON courts;
CREATE POLICY "Admins actualizan canchas"
ON courts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 2. (Opcional) Política INSERT: Admins pueden crear nuevas canchas
DROP POLICY IF EXISTS "Admins crean canchas" ON courts;
CREATE POLICY "Admins crean canchas"
ON courts FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 3. (Opcional) Política DELETE: Admins pueden eliminar canchas
DROP POLICY IF EXISTS "Admins eliminan canchas" ON courts;
CREATE POLICY "Admins eliminan canchas"
ON courts FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Verificar políticas existentes en courts
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'courts';
