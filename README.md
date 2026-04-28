# Reservas Club Deportivo Minvu Serviu

Sistema de reservas de canchas deportivas construido con Next.js 15 y Supabase.

## Estructura del Proyecto

- `/src/app` - Páginas de la aplicación (Next.js App Router)
  - `/` - Landing Page con fotos del recinto y precios
  - `/login` - Inicio de sesión
  - `/register` - Registro de usuarios
  - `/dashboard` - Panel del usuario para ver sus reservas
  - `/reservar` - Formulario de nueva reserva (bloques de 1 hora)
  - `/calendario` - Vista pública de disponibilidad
  - `/admin` - Panel de administración y auditoría
- `/src/components` - Componentes UI reutilizables
- `/src/lib/supabase` - Clientes de Supabase (browser y server)
- `/supabase/migrations` - Scripts SQL para la base de datos
- `/supabase/functions` - Edge Functions (notificaciones por correo)

## Configuración Local

1. Copiar `.env.local.example` a `.env.local` y completar con tus credenciales de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

2. Instalar dependencias:
```bash
npm install
```

3. Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

## Configuración de Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.com)
2. Ir a SQL Editor y ejecutar el contenido de:
   - `schema_supabase.sql` (crea tablas y políticas RLS)
   - `supabase/migrations/002_triggers_and_seed.sql` (triggers de auditoría y datos iniciales)
3. Configurar Storage:
   - Crear un bucket llamado `payment-proofs` (público o privado según prefieras)
4. Configurar Edge Function (opcional):
   - Instalar Supabase CLI
   - Desplegar la función `send-email` con tu API key de Resend

## Despliegue en Vercel

1. Subir el código a un repositorio de GitHub
2. Importar el proyecto en [Vercel](https://vercel.com)
3. Configurar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Desplegar

## Perfiles de Usuario

- **Usuario**: Puede registrarse, loguearse, hacer reservas y ver su historial.
- **Administrador**: Aprueba/rechaza reservas y gestiona bloqueos de horarios.
- **Super Admin**: Puede editar/eliminar reservas y ver logs de auditoría.

## Notas

- Las fotos del recinto están en `/public/fotos/` y se pueden reemplazar directamente.
- El calendario público muestra:
  - ⚪ Blanco: Disponible
  - 🟨 Amarillo: Pendiente
  - 🟩 Verde: Aprobado
  - ⬛ Gris: Bloqueado
