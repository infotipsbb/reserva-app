# Arquitectura y Especificación: Sistema de Reservas CD Minvu Serviu

> **Documento de reconstrucción Mobile-First**
> Basado en las lecciones aprendidas del desarrollo actual (Abril-Junio 2026)

---

## 1. Diagnóstico: Por qué falló la versión actual

### 1.1 Errores arquitectónicos fundamentales

| Error | Consecuencia | Lección |
|---|---|---|
| **Next.js 16 App Router + Supabase SSR** | Las soft navigations rompían las cookies de sesión. El dashboard crasheaba con 500. | Para apps con auth persistente, usar **Pages Router** o un framework más estable con auth. |
| **`getUser()` en Server Components** | `getUser()` hace petición de red en cada render. En producción con cookies desincronizadas, lanzaba excepciones no capturadas. | **Nunca** hacer peticiones de red en Server Components para auth. La sesión debe verificarse 100% en el cliente. |
| **Cliente Supabase como singleton sin control** | Race conditions de locks del token en móvil. Múltiples componentes (navbar + página) accedían simultáneamente. | El cliente debe inicializarse una sola vez y exponer una API que serialice las peticiones auth. |
| **Server Actions (`"use server"`) para crear perfil** | En móvil/incógnito, las Server Actions fallaban silenciosamente por problemas de cookies. | Evitar Server Actions para operaciones críticas. Todo debe funcionar con el cliente normal autenticado. |
| **Subida de archivos (Storage) sin fallback** | Si el upload se colgaba, no había timeout. El botón quedaba en "Procesando..." eternamente. | Toda petición de red debe tener timeout y manejo de error claro. |
| **Email dependiente de Edge Function no desplegada** | Resend en modo testing solo envía al email propietario. Nunca se configuró dominio verificado. | El email debe ser **opcional** (no bloqueante) y el envío debe hacerse desde triggers DB, no desde el frontend. |
| **No hay indicadores de progreso por paso** | El usuario no sabía qué estaba pasando durante los 5-10 segundos de carga. | Cada operación larga debe tener feedback visual de progreso. |

### 1.2 Lo que funcionó bien (conservar)

- La estructura de la base de datos (tablas, triggers de auditoría, RLS).
- El diseño UI con Tailwind + componentes shadcn/ui.
- El flujo de negocio: selección de cancha → fecha → horario → socio/no socio → comprobante.
- El concepto de soft-navigation con hard refresh en puntos clave.

---

## 2. Stack tecnológico recomendado (Mobile-First)

### 2.1 Frontend

| Tecnología | Rol | Por qué |
|---|---|---|
| **Vite + React 18** | Framework base | Más rápido y predecible que Next.js 16 para SPAs. Sin problemas de SSR/auth. |
| **React Router v6** | Navegación | Router del lado del cliente. Navegaciones instantáneas, sin recargas. |
| **Tailwind CSS v4** | Estilos | Mobile-first por diseño. Un solo CSS generado. |
| **shadcn/ui** | Componentes UI | Accesibles, responsivos, sin dependencias pesadas. |
| **TanStack Query (React Query)** | Manejo de datos | Cache inteligente, reintentos automáticos, estados de loading/error por defecto. |
| **Zustand** | Estado global | Ligero. Para guardar sesión del usuario y estado de la reserva en progreso. |

### 2.2 Backend / Base de Datos

| Tecnología | Rol | Por qué |
|---|---|---|
| **Supabase (PostgreSQL)** | Base de datos + Auth | PostgreSQL robusto. Auth con email/password. RLS para seguridad. |
| **Supabase Storage** | Archivos (comprobantes) | Bucket con políticas. Upload directo desde el navegador con cliente autenticado. |
| **Supabase Edge Functions** | Email (opcional) | Solo para enviar correos. No es crítico para el flujo principal. |
| **Triggers PostgreSQL** | Auditoría + email | Todo lo que debe ser 100% confiable va en triggers DB, no en el frontend. |

### 2.3 Por qué NO usar Next.js App Router para esta app

Next.js 16 App Router está diseñado para:
- Sitios con mucho contenido estático (blogs, e-commerce).
- Server Components que renderizan en el servidor.

**No está diseñado para:**
- Apps con autenticación persistente del lado del cliente.
- Operaciones de upload de archivos desde el navegador.
- Soft navigations con estado de sesión complejo.

**El problema:** En App Router, cada "página" puede ser un Server Component que corre en el servidor de Vercel. Si ese componente intenta leer cookies de auth, y las cookies no están sincronizadas (por soft navigations, cache, incógnito), la página crashea con 500. Esto no pasa con React puro + Router, donde TODO corre en el navegador.

---

## 3. Arquitectura de la aplicación

### 3.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│  NAVEGADOR (Cliente)                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + Vite + React Router                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │  │
│  │  │  Páginas     │  │  TanStack    │  │  Zustand   │   │  │
│  │  │  (Router)    │  │  Query       │  │  (Estado)  │   │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                      │                                      │
│  ┌───────────────────┴───────────────────────────────────┐  │
│  │  Supabase Cliente (singleton, una sola instancia)     │  │
│  │  - Auth (localStorage + cookies)                      │  │
│  │  - DB (queries con RLS)                               │  │
│  │  - Storage (upload directo)                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE CLOUD                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  PostgreSQL      │  │  Storage     │  │  Auth        │   │
│  │  + Triggers      │  │  (Buckets)   │  │  (GoTrue)    │   │
│  └──────────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Principios arquitectónicos

1. **Todo el auth es cliente.** Nunca se verifica la sesión en el servidor. El servidor solo sirve el bundle JS estático.
2. **Un solo cliente Supabase.** Se inicializa una vez en `main.tsx` y se inyecta via contexto.
3. **TanStack Query para TODO.** Cada petición a Supabase va via TanStack Query. Esto da: caching, reintentos, estados de loading/error automáticos.
4. **Timeouts en TODO.** Cada operación de red tiene un timeout de 10-15 segundos.
5. **El email es un efecto secundario.** Se envía desde triggers PostgreSQL, no desde el frontend. Si falla, la reserva ya está guardada.
6. **Offline-first básico.** Si el usuario pierde conexión, se muestra un mensaje claro. No se quedan botones pegados.

---

## 4. Estructura de datos (PostgreSQL)

### 4.1 Tablas (mismo esquema actual, funciona bien)

```sql
-- Tipos ENUM
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'rejected');

-- Perfiles (se crean automáticamente via trigger en auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canchas / Espacios deportivos
CREATE TABLE courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price_per_hour DECIMAL NOT NULL,      -- precio no socio
  price_member DECIMAL,                  -- precio socio
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Reservas
CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  court_id UUID REFERENCES courts(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status reservation_status DEFAULT 'pending' NOT NULL,
  payment_proof_url TEXT,
  total_price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bloqueos de disponibilidad
CREATE TABLE availability_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID REFERENCES courts(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reason TEXT
);

-- Auditoría
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Políticas RLS mínimas necesarias

```sql
-- Profiles: usuario ve y gestiona su propio perfil
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courts: visibles para todos si están activas
CREATE POLICY "Public view courts" ON courts FOR SELECT USING (is_active = TRUE);

-- Reservations: usuario ve las suyas, inserta para sí mismo
CREATE POLICY "Users view own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reservation" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins ven todas y actualizan estado
CREATE POLICY "Admins view all" ON reservations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins update status" ON reservations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Availability blocks: público ve, admin gestiona
CREATE POLICY "Public view blocks" ON availability_blocks FOR SELECT USING (true);
CREATE POLICY "Admins manage blocks" ON availability_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
```

### 4.3 Triggers obligatorios

```sql
-- 1. Crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, phone, role)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Auditoría automática
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
  FOR EACH ROW EXECUTE FUNCTION log_reservation_changes();

-- 3. Email al crear reserva (vía Edge Function - REQUIERE pg_net)
-- NOTA: Solo si pg_net está disponible. Si no, el email no se envía
-- pero la reserva se guarda igual.
CREATE OR REPLACE FUNCTION notify_reservation_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-email'),
    headers := jsonb_build_object(
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('type', 'pending', 'record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservation_created_notification_trigger
  AFTER INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION notify_reservation_created();
```

---

## 5. Flujos de usuario (Mobile-First)

### 5.1 Visitante (no autenticado)

```
Landing Page
├── Hero con imagen del club
├── Tarjetas de canchas con precios (carga desde /rest/v1/courts)
├── Galería de fotos
├── CTA: "Ver disponibilidad" → /calendario
└── CTA: "Reservar" → /login (con redirect a /reservar tras login)

Calendario Público (/calendario)
├── Selector de cancha (dropdown)
├── Calendario mensual interactivo
│   └── Colores: disponible (blanco), pendiente (amarillo), aprobada (verde), bloqueado (gris)
└── Click en día → lista de reservas y bloqueos de ese día
```

### 5.2 Registro + Auto-login

```
/register
├── Formulario: nombre, teléfono, email, contraseña
├── Submit → supabase.auth.signUp()
├── Si success → supabase.auth.signInWithPassword() inmediatamente
├── Si auto-login success → redirect a /dashboard
└── Si email requiere confirmación → mensaje claro + link a login

IMPORTANTE: No hacer update de perfil manual. El trigger ya lo creó.
Solo redirigir al dashboard.
```

### 5.3 Login

```
/login
├── Formulario: email, contraseña
├── Submit → supabase.auth.signInWithPassword()
├── Success → redirect a /dashboard (o a la ruta guardada en ?redirect=)
└── Error → mensaje debajo del formulario
```

### 5.4 Dashboard (Mis Reservas)

```
/dashboard
├── TanStack Query carga reservas del usuario
├── Estado loading: spinner
├── Estado error: "Error cargando reservas. Reintentar"
├── Lista de reservas ordenadas por fecha (más reciente primero)
│   ├── Badge de estado (pendiente/aprobada/rechazada)
│   ├── Fecha, horario, cancha
│   └── Link al comprobante (si existe)
└── Botón "Nueva Reserva" → /reservar
```

### 5.5 Nueva Reserva (Wizard de 4 pasos)

```
/reservar
├── Protección: si no hay sesión, redirect a /login
│
├── PASO 1: Seleccionar Cancha
│   ├── Lista de canchas activas (cards clickeables)
│   ├── Foto, nombre, tipo, precio
│   └── Seleccionar → paso 2
│
├── PASO 2: Seleccionar Fecha
│   ├── Calendario interactivo
│   ├── Días pasados: disabled
│   ├── Días con bloqueo total: disabled
│   └── Seleccionar → paso 3
│
├── PASO 3: Seleccionar Horarios
│   ├── Grilla de slots de 1 hora (08:00 - 21:00)
│   ├── Slots reservados/bloqueados: disabled
│   ├── Slots disponibles: clickeables
│   └── Solo permitir selección consecutiva
│
├── PASO 4: Resumen + Comprobante
│   ├── Toggle: Socio / No Socio
│   ├── Cálculo dinámico del total
│   ├── Input file: comprobante de pago (imagen/PDF)
│   ├── Validación: archivo < 5MB
│   └── Botón "Confirmar Reserva"
│
└── Submit:
    ├── Validar sesión (getSession, local)
    ├── Verificar/crear perfil (select + insert si falta)
    ├── Subir comprobante a Storage (con timeout 15s)
    ├── Validar disponibilidad final (anti-overlap)
    ├── Insertar reserva
    ├── Mostrar pantalla de éxito
    └── Email se envía automáticamente desde trigger DB
```

### 5.6 Panel Admin

```
/admin
├── Protección: verificar rol admin/super_admin en cliente
│   (si no es admin, redirect a /dashboard)
│
├── SECCIÓN: Solicitudes Pendientes
│   ├── Lista de reservas con status = 'pending'
│   ├── Datos del usuario (nombre, email, teléfono)
│   ├── Detalle: cancha, fecha, horario, total
│   ├── Link al comprobante (abre en nueva pestaña)
│   ├── Botón "Aprobar" → update status = 'approved'
│   └── Botón "Rechazar" → update status = 'rejected'
│
├── SECCIÓN: Bloquear Horarios
│   ├── Formulario: cancha, fecha/hora inicio, fecha/hora fin, motivo
│   ├── Lista de bloqueos activos (últimos 20)
│   └── Botón eliminar bloqueo
│
├── SECCIÓN: Gestión de Canchas
│   ├── Lista de canchas con precios
│   ├── Editar precio socio / no socio
│   └── Activar/desactivar cancha
│
└── SECCIÓN: Reservas Aprobadas
    └── Lista de reservas con status = 'approved'

/admin/auditoria (solo super_admin)
└── Tabla de audit_logs ordenados por fecha descendente
```

---

## 6. Estructura de archivos del proyecto

```
reserva-app-v2/
├── public/
│   └── fotos/
│       ├── cancha_futbol.jpg
│       ├── cancha_tenis.jpg
│       └── gimnasio.jpg
├── src/
│   ├── main.tsx                    # Entry point. Inicializa Supabase client
│   ├── App.tsx                     # Router principal
│   ├── index.css                   # Tailwind + variables globales
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── Navbar.tsx              # Barra de navegación (cliente)
│   │   ├── ProtectedRoute.tsx      # Wrapper que verifica sesión
│   │   ├── CourtCard.tsx           # Tarjeta de cancha
│   │   ├── SlotPicker.tsx          # Selector de horarios
│   │   └── ReservationSummary.tsx  # Resumen de reserva
│   │
│   ├── hooks/
│   │   ├── useAuth.ts              # Hook de autenticación
│   │   ├── useCourts.ts            # TanStack Query: canchas
│   │   ├── useReservations.ts      # TanStack Query: reservas
│   │   └── useAvailability.ts      # TanStack Query: disponibilidad
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase (singleton)
│   │   ├── queries.ts              # Funciones que llaman a Supabase
│   │   └── utils.ts                # Utilidades (formato fecha, etc.)
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ReservarPage.tsx        # Wizard de 4 pasos
│   │   ├── CalendarioPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── AuditoriaPage.tsx
│   │
│   └── stores/
│       └── authStore.ts            # Zustand: sesión del usuario
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql          # Esquema completo
│   │   ├── 002_triggers.sql        # Triggers
│   │   └── 003_seed.sql            # Datos iniciales (canchas)
│   └── functions/
│       └── send-email/
│           └── index.ts            # Edge Function para emails
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Patrones de código clave

### 7.1 Cliente Supabase (singleton)

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

**Nota:** Se usa `@supabase/supabase-js` (no `@supabase/ssr`). El SSR no es necesario porque no hay Server Components.

### 7.2 Hook de autenticación

```typescript
// src/hooks/useAuth.ts
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Verificar sesión al montar
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkSession();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);
}
```

### 7.3 Petición con TanStack Query (ej: canchas)

```typescript
// src/hooks/useCourts.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useCourts() {
  return useQuery({
    queryKey: ["courts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
}
```

### 7.4 Protected Route

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

### 7.5 Submit de reserva con timeout

```typescript
// src/lib/queries.ts
export async function createReservation(payload: ReservationPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Debes iniciar sesión");

    // 2. Subir comprobante
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    // 3. Insertar reserva
    const { error: insertError } = await supabase
      .from("reservations")
      .insert({ ...payload, user_id: session.user.id });
    if (insertError) throw insertError;

    return { success: true };
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## 8. Checklist de implementación

### Fase 1: Fundamentos (Día 1-2)
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Instalar Tailwind, shadcn/ui, React Router, TanStack Query, Zustand
- [ ] Configurar Supabase (nuevo proyecto o usar el existente)
- [ ] Ejecutar migraciones SQL (schema + triggers)
- [ ] Configurar cliente Supabase en `src/lib/supabase.ts`
- [ ] Implementar auth store con Zustand
- [ ] Implementar Navbar con protección de rutas

### Fase 2: Páginas públicas (Día 3)
- [ ] Landing Page (hero, canchas, galería)
- [ ] Calendario público
- [ ] Login y Registro (con auto-login)

### Fase 3: Funcionalidades de usuario (Día 4-5)
- [ ] Dashboard (mis reservas)
- [ ] Wizard de reserva (4 pasos)
- [ ] Upload de comprobante a Storage

### Fase 4: Panel Admin (Día 6)
- [ ] Panel de solicitudes pendientes
- [ ] Aprobar/rechazar reservas
- [ ] Bloquear horarios
- [ ] Gestión de canchas y precios

### Fase 5: Email y pulido (Día 7)
- [ ] Configurar dominio en Resend
- [ ] Desplegar Edge Function `send-email`
- [ ] Verificar que triggers envían email
- [ ] Pruebas en móvil (Chrome DevTools Remote Debugging)
- [ ] Optimizar imágenes y bundle

---

## 9. Lecciones finales: Qué NUNCA hacer

1. **Nunca uses Server Components para auth.** Verifica la sesión 100% en el cliente.
2. **Nunca confíes en que una petición de red va a responder.** Siempre usa timeout + catch.
3. **Nunca hagas que el email sea bloqueante.** Si falla el email, la reserva ya debe estar guardada.
4. **Nunca crees múltiples instancias del cliente Supabase.** Una sola instancia, un solo lock.
5. **Nunca uses `.single()` sin estar seguro de que el registro existe.** Usa `.maybeSingle()` para evitar errores 406.
6. **Nunca deposites la lógica crítica en Server Actions.** Las Server Actions dependen de cookies que pueden fallar en móvil/incógnito.
7. **Nunca ignores el testing en móvil desde el día 1.** El 70% de los usuarios van a usar la app desde el celular.

---

**Documento preparado:** Junio 2026
**Versión:** 1.0 - Mobile-First Rebuild Specification
