-- POLÍTICA RLS: Permitir a admins insertar bloqueos de disponibilidad
DROP POLICY IF EXISTS "Admins insert blocks" ON availability_blocks;

CREATE POLICY "Admins insert blocks"
  ON availability_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- POLÍTICA RLS: Permitir a admins eliminar bloqueos
DROP POLICY IF EXISTS "Admins delete blocks" ON availability_blocks;

CREATE POLICY "Admins delete blocks"
  ON availability_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- VERIFICAR POLÍTICAS ACTUALES
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'availability_blocks';
