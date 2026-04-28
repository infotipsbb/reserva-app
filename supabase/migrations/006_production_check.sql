-- =====================================================
-- VERIFICACIÓN Y ACTUALIZACIÓN SEGURA PARA PRODUCCIÓN
-- Club Deportivo Minvu Serviu
-- Ejecutar esto en Supabase SQL Editor si YA tienes tablas creadas
-- =====================================================

-- 1. Verificar/Agregar columna price_member a courts
ALTER TABLE courts ADD COLUMN IF NOT EXISTS price_member DECIMAL;

-- 2. Actualizar precios de socio para las canchas existentes
UPDATE courts SET price_member = 25000 WHERE name = 'Cancha de Fútbol' AND price_member IS NULL;
UPDATE courts SET price_member = 10000 WHERE name LIKE 'Cancha de Tenis%' AND price_member IS NULL;
UPDATE courts SET price_member = 18000 WHERE name = 'Gimnasio Polideportivo' AND price_member IS NULL;

-- 3. Verificar que las políticas RLS del calendario público existan
DROP POLICY IF EXISTS "Public view approved reservations" ON reservations;
CREATE POLICY "Public view approved reservations"
ON reservations FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Public view pending reservations" ON reservations;
CREATE POLICY "Public view pending reservations"
ON reservations FOR SELECT USING (status = 'pending');

DROP POLICY IF EXISTS "Public view blocks" ON availability_blocks;
CREATE POLICY "Public view blocks"
ON availability_blocks FOR SELECT USING (true);

-- 4. Políticas de Storage para bucket payment-proofs (ejecutar DESPUÉS de crear el bucket)
-- NOTA: Descomenta y ejecuta esto solo después de crear el bucket en la UI de Supabase

-- CREATE POLICY "Users can upload their own payment proofs"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'payment-proofs' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Public can view payment proofs"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'payment-proofs');

-- 5. Verificación final
SELECT 
  name, 
  type, 
  price_per_hour, 
  price_member, 
  is_active 
FROM courts 
ORDER BY name;
