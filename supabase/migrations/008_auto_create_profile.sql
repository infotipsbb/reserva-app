-- =====================================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- =====================================================
-- Este trigger se ejecuta cada vez que se inserta un nuevo
-- usuario en auth.users (registro, signUp).
-- Crea automáticamente el registro correspondiente en la
-- tabla profiles con los datos disponibles.
-- =====================================================

-- Función que crea el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users
-- Primero eliminamos si ya existe para evitar duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Nota: El trigger se ejecuta con SECURITY DEFINER para que
-- tenga privilegios suficientes para insertar en public.profiles.
