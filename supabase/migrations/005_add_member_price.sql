-- Agregar columna price_member a tabla courts (si no existe)
ALTER TABLE courts ADD COLUMN IF NOT EXISTS price_member DECIMAL;

-- Actualizar precios de socio para las canchas existentes
UPDATE courts SET price_member = 25000 WHERE name = 'Cancha de Fútbol';
UPDATE courts SET price_member = 10000 WHERE name LIKE 'Cancha de Tenis%';
UPDATE courts SET price_member = 18000 WHERE name = 'Gimnasio Polideportivo';

-- Verificar
SELECT name, price_per_hour, price_member FROM courts;
