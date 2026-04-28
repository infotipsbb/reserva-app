-- Trigger para auditoría automática en reservas
CREATE OR REPLACE FUNCTION log_reservation_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, target_id, details)
    VALUES (NEW.user_id, 'created_reservation', NEW.id, row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (actor_id, action, target_id, details)
    VALUES (NEW.user_id, 'updated_reservation', NEW.id, json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (actor_id, action, target_id, details)
    VALUES (OLD.user_id, 'deleted_reservation', OLD.id, row_to_json(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_changes();

-- Trigger para enviar notificación por correo (invoca Edge Function)
CREATE OR REPLACE FUNCTION notify_reservation_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    PERFORM net.http_post(
      url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
      headers := jsonb_build_object(
        'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('record', row_to_json(NEW), 'old_record', row_to_json(OLD))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_notification_trigger
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION notify_reservation_approval();

-- Insertar espacios deportivos del Club Deportivo Minvu Serviu
INSERT INTO courts (name, type, price_per_hour, price_member, image_url) VALUES
('Cancha de Fútbol', 'Fútbol', 35000, 25000, '/fotos/cancha_futbol.jpg'),
('Cancha de Tenis 1', 'Tenis', 15000, 10000, '/fotos/cancha_futbol.jpg'),
('Cancha de Tenis 2', 'Tenis', 15000, 10000, '/fotos/cancha_futbol.jpg'),
('Gimnasio Polideportivo', 'Polideportivo', 25000, 18000, '/fotos/gimnasio.jpg');
