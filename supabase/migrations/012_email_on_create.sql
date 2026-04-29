-- =====================================================
-- MIGRACIÓN: Trigger de email al crear reserva
-- =====================================================
-- Este trigger envía un email automático cuando un usuario
-- crea una nueva reserva (estado = 'pending').
-- Requiere que la extensión pg_net esté habilitada.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE OR REPLACE FUNCTION notify_reservation_created()
    RETURNS TRIGGER AS $inner$
    BEGIN
      PERFORM net.http_post(
        url := 'https://tearpshutyhtdirnwsxl.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('type', 'pending', 'record', row_to_json(NEW))
      );
      RETURN NEW;
    END;
    $inner$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS reservation_created_notification_trigger ON reservations;
    CREATE TRIGGER reservation_created_notification_trigger
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION notify_reservation_created();

    RAISE NOTICE 'Trigger de notificacion al crear reserva instalado correctamente.';
  ELSE
    RAISE NOTICE 'Extension pg_net no encontrada. Saltando trigger de notificaciones por correo al crear reserva.';
  END IF;
END $$;
