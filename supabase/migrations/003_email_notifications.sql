-- =====================================================
-- MIGRACIÓN: Sistema de Notificaciones por Correo
-- Requiere: Resend API Key configurada en Supabase Edge Functions Secrets
--           Variables: RESEND_API_KEY, PROJECT_URL, SERVICE_ROLE_KEY
-- =====================================================

-- 1. Trigger para notificación de SOLICITUD PENDIENTE (nueva reserva)
CREATE OR REPLACE FUNCTION notify_reservation_pending()
RETURNS TRIGGER AS $$
BEGIN
  -- Llamar Edge Function con los datos de la reserva
  PERFORM net.http_post(
    url := 'https://tearpshutyhtdirnwsxl.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYXJwc2h1dHlodGRpcm53c3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzQxMzcsImV4cCI6MjA5MjgxMDEzN30.qdZ9ppp6RqzCNUGEZWahvVQPDKEVW7MZ-fMTuN8D_jI',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', 'pending',
      'record', jsonb_build_object(
        'user_id', NEW.user_id,
        'court_id', NEW.court_id,
        'date', NEW.date,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'total_price', NEW.total_price
      )
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si falla el envío de correo, no bloquear la reserva
  RAISE NOTICE 'Error enviando correo de pendiente: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reservation_pending_trigger ON reservations;
CREATE TRIGGER reservation_pending_trigger
AFTER INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION notify_reservation_pending();

-- 2. Trigger para notificación de APROBACIÓN
CREATE OR REPLACE FUNCTION notify_reservation_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo enviar si cambia de pending a approved
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    PERFORM net.http_post(
      url := 'https://tearpshutyhtdirnwsxl.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlYXJwc2h1dHlodGRpcm53c3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzQxMzcsImV4cCI6MjA5MjgxMDEzN30.qdZ9ppp6RqzCNUGEZWahvVQPDKEVW7MZ-fMTuN8D_jI',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', 'approved',
        'record', jsonb_build_object(
          'user_id', NEW.user_id,
          'court_id', NEW.court_id,
          'date', NEW.date,
          'start_time', NEW.start_time,
          'end_time', NEW.end_time,
          'total_price', NEW.total_price
        )
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si falla el envío de correo, no bloquear la aprobación
  RAISE NOTICE 'Error enviando correo de aprobación: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reservation_approved_trigger ON reservations;
CREATE TRIGGER reservation_approved_trigger
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION notify_reservation_approved();

-- 3. Trigger anterior (notificación) - ELIMINAR si existe para evitar duplicados
DROP TRIGGER IF EXISTS reservation_notification_trigger ON reservations;

SELECT 'Triggers de notificación reconfigurados correctamente' AS status;
