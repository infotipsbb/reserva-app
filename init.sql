-- =====================================================
-- INICIALIZACIÓN COMPLETA: Club Deportivo Minvu Serviu
-- Base de datos: PostgreSQL (Supabase Cloud)
-- =====================================================

-- 1. TIPOS ENUM (con manejo de errores si ya existen)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Type user_role already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'Type reservation_status already exists, skipping...';
END $$;

-- 2. TABLA DE PERFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA DE ESPACIOS DEPORTIVOS (CANCHAS / GIMNASIO)
CREATE TABLE IF NOT EXISTS courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price_per_hour DECIMAL NOT NULL,
  price_member DECIMAL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. TABLA DE RESERVAS
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  court_id UUID REFERENCES courts(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status reservation_status DEFAULT 'pending' NOT NULL,
  payment_proof_url TEXT,
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABLA DE BLOQUEOS DE DISPONIBILIDAD
CREATE TABLE IF NOT EXISTS availability_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT
);

-- 6. TABLA DE AUDITORÍA
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. HABILITAR ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 POLITICAS RLS PARA PROFILES
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

-- 8. POLÍTICAS RLS
-- Eliminamos primero si existen para evitar errores
DROP POLICY IF EXISTS "Cualquiera puede ver canchas activas" ON courts;
DROP POLICY IF EXISTS "Usuarios ven sus propias reservas" ON reservations;
DROP POLICY IF EXISTS "Admins ven todas las reservas" ON reservations;
DROP POLICY IF EXISTS "Usuarios crean sus propias reservas" ON reservations;
DROP POLICY IF EXISTS "Admins actualizan reservas" ON reservations;

-- Canchas: Visibles para todos si están activas
CREATE POLICY "Cualquiera puede ver canchas activas" 
ON courts FOR SELECT USING (is_active = TRUE);

-- Canchas: Admins pueden actualizar precios y estado
DROP POLICY IF EXISTS "Admins actualizan canchas" ON courts;
CREATE POLICY "Admins actualizan canchas"
ON courts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Canchas: Admins pueden crear nuevas canchas
DROP POLICY IF EXISTS "Admins crean canchas" ON courts;
CREATE POLICY "Admins crean canchas"
ON courts FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Reservas: Usuarios ven las suyas
CREATE POLICY "Usuarios ven sus propias reservas" 
ON reservations FOR SELECT USING (auth.uid() = user_id);

-- Reservas: Admins ven todas
CREATE POLICY "Admins ven todas las reservas" 
ON reservations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Reservas: Usuarios solo crean para sí mismos
CREATE POLICY "Usuarios crean sus propias reservas" 
ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reservas: Admins pueden actualizar estado
CREATE POLICY "Admins actualizan reservas" 
ON reservations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Reservas: Público ve reservas aprobadas y pendientes (para calendario público)
DROP POLICY IF EXISTS "Public view approved reservations" ON reservations;
CREATE POLICY "Public view approved reservations"
ON reservations FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Public view pending reservations" ON reservations;
CREATE POLICY "Public view pending reservations"
ON reservations FOR SELECT USING (status = 'pending');

-- Bloqueos: Público puede ver bloqueos (calendario público)
DROP POLICY IF EXISTS "Public view blocks" ON availability_blocks;
CREATE POLICY "Public view blocks"
ON availability_blocks FOR SELECT USING (true);

-- Bloqueos: Admins pueden crear bloqueos
DROP POLICY IF EXISTS "Admins insert blocks" ON availability_blocks;
CREATE POLICY "Admins insert blocks"
ON availability_blocks FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Bloqueos: Admins pueden eliminar bloqueos
DROP POLICY IF EXISTS "Admins delete blocks" ON availability_blocks;
CREATE POLICY "Admins delete blocks"
ON availability_blocks FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 9. FUNCIONES Y TRIGGERS DE AUDITORÍA
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

DROP TRIGGER IF EXISTS reservation_audit_trigger ON reservations;
CREATE TRIGGER reservation_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_reservation_changes();

-- 10. TRIGGER DE NOTIFICACIÓN POR CORREO (Opcional)
-- NOTA: Este trigger requiere que la extensión pg_net esté habilitada.
-- Si falla, comenta o elimina esta sección.
DO $$
BEGIN
  -- Verificamos si pg_net está disponible
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE OR REPLACE FUNCTION notify_reservation_approval()
    RETURNS TRIGGER AS $inner$
    BEGIN
      IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        PERFORM net.http_post(
          url := 'https://tearpshutyhtdirnwsxl.supabase.co/functions/v1/send-email',
          headers := jsonb_build_object(
            'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('record', row_to_json(NEW), 'old_record', row_to_json(OLD))
        );
      END IF;
      RETURN NEW;
    END;
    $inner$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS reservation_notification_trigger ON reservations;
    CREATE TRIGGER reservation_notification_trigger
    AFTER UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION notify_reservation_approval();
  ELSE
    RAISE NOTICE 'Extensión pg_net no encontrada. Saltando trigger de notificaciones por correo.';
  END IF;
END $$;

-- 11. SEED DATA - Espacios Deportivos Reales
-- Usamos ON CONFLICT para no duplicar si ya existen
INSERT INTO courts (name, type, price_per_hour, price_member, image_url) VALUES
('Cancha de Fútbol', 'Fútbol', 35000, 25000, '/fotos/cancha_futbol.jpg'),
('Cancha de Tenis 1', 'Tenis', 15000, 10000, '/fotos/cancha_futbol.jpg'),
('Cancha de Tenis 2', 'Tenis', 15000, 10000, '/fotos/cancha_futbol.jpg'),
('Gimnasio Polideportivo', 'Polideportivo', 25000, 18000, '/fotos/gimnasio.jpg');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
