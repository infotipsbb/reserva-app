-- =====================================================
-- ELIMINAR TRIGGERS DE CORREO ANTIGUOS (pg_net no disponible en Supabase Cloud)
-- Los correos ahora se envían desde Next.js Server Actions
-- =====================================================

-- Eliminar triggers antiguos que fallan
DROP TRIGGER IF EXISTS reservation_pending_trigger ON reservations;
DROP TRIGGER IF EXISTS reservation_approved_trigger ON reservations;
DROP TRIGGER IF EXISTS reservation_notification_trigger ON reservations;

-- Eliminar funciones antiguas
DROP FUNCTION IF EXISTS notify_reservation_pending();
DROP FUNCTION IF EXISTS notify_reservation_approval();

SELECT 'Triggers de correo eliminados. Los correos ahora se envían desde el servidor Next.js.' AS status;
