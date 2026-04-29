-- =====================================================
-- LIMPIEZA DE BASE DE DATOS — Club Deportivo Minvu Serviu
-- Uso: Ejecutar en el SQL Editor de Supabase
-- =====================================================
-- ⚠️ ADVERTENCIA: Este script borra datos de usuarios y reservas.
--    Conserva las canchas (seed data) y los perfiles de administradores.
-- =====================================================

-- 1. BORRAR AUDIT LOGS (sin dependencias críticas)
--    Esto limpia el historial de auditoría.
DELETE FROM audit_logs;

-- 2. BORRAR BLOQUEOS DE DISPONIBILIDAD
--    Elimina todos los bloqueos de horarios creados por administradores.
DELETE FROM availability_blocks;

-- 3. BORRAR RESERVAS
--    Elimina TODAS las reservas (pendientes, aprobadas y rechazadas).
DELETE FROM reservations;

-- 4. BORRAR PERFILES DE USUARIOS NORMALES (role = 'user')
--    Al borrar el perfil, las reservas se eliminan en cascada (CASCADE).
--    Los audit_logs conservan el registro pero con actor_id = NULL (SET NULL).
--    Conserva administradores (admin) y super administradores (super_admin).
DELETE FROM profiles
WHERE role = 'user';

-- =====================================================
-- INSTRUCCIONES POST-SCRIPT (Pasos manuales en Supabase)
-- =====================================================

-- PASO 5 (MANUAL): Borrar usuarios de Auth
--    Tras aplicar la migración 010, los perfiles se pueden borrar
--    limpiamente junto con sus reservas. Ahora solo quedan los
--    registros en auth.users que debes eliminar manualmente:
--
--    1. Ve a Supabase Dashboard > Authentication > Users
--    2. Selecciona los usuarios de prueba (los que tienen role = 'user')
--    3. Haz clic en "Delete selected users"
--
--    ⚠️ NO borres los usuarios que tengan rol 'admin' o 'super_admin'

-- =====================================================
-- VERIFICACIÓN RÁPIDA (Opcional: descomenta para ejecutar)
-- =====================================================
-- SELECT 'Reservas' as tabla, COUNT(*) as registros FROM reservations
-- UNION ALL
-- SELECT 'Bloqueos', COUNT(*) FROM availability_blocks
-- UNION ALL
-- SELECT 'Audit Logs', COUNT(*) FROM audit_logs
-- UNION ALL
-- SELECT 'Perfiles (users)', COUNT(*) FROM profiles WHERE role = 'user'
-- UNION ALL
-- SELECT 'Perfiles (admins)', COUNT(*) FROM profiles WHERE role IN ('admin', 'super_admin')
-- UNION ALL
-- SELECT 'Canchas', COUNT(*) FROM courts;
