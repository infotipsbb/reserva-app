# Funcionalidades del Sistema de Reservas

> **Proyecto:** Club Deportivo Minvu Serviu  
> **Documento:** Catálogo completo de funcionalidades implementadas por rol de usuario.

---

## Índice de Roles

1. [Visitante (No autenticado)](#1-visitante-no-autenticado)
2. [Usuario Registrado](#2-usuario-registrado-role--user)
3. [Administrador](#3-administrador-role--admin)
4. [Super Administrador](#4-super-administrador-role--super_admin)

---

## 1. Visitante (No autenticado)

Usuario que aún no ha iniciado sesión. Puede navegar por las secciones públicas de la aplicación.

### 1.1 Landing Page (`/`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1.1.1 | **Ver Hero** | Visualizar imagen de fondo del club con título y descripción. |
| 1.1.2 | **Ver precios** | Ver las 4 canchas con precio socio y precio no socio. |
| 1.1.3 | **Ver galería** | Visualizar fotos de las instalaciones (cancha de fútbol y gimnasio). |
| 1.1.4 | **Ver CTA** | Acceder a botones "Crear Cuenta" e "Iniciar Sesión". |
| 1.1.5 | **Navegar a reservar** | Click en "Reservar Ahora" lleva a `/reservar`. |
| 1.1.6 | **Navegar a calendario** | Click en "Ver Disponibilidad" lleva a `/calendario`. |

### 1.2 Calendario Público (`/calendario`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1.2.1 | **Ver calendario mensual** | Calendario interactivo con días coloreados según estado. |
| 1.2.2 | **Filtrar por cancha** | Selector dropdown para ver disponibilidad de una cancha específica o todas. |
| 1.2.3 | **Ver leyenda de colores** | Identificar: disponible (blanco), pendiente (amarillo), aprobada (verde), bloqueado (gris). |
| 1.2.4 | **Ver detalles por fecha** | Al hacer clic en un día, ver reservas y bloqueos de ese día. |
| 1.2.5 | **Ver reservas del día** | Para la fecha seleccionada, ver lista de reservas con cancha y estado. |
| 1.2.6 | **Ver bloqueos del día** | Para la fecha seleccionada, ver bloqueos activos con horario y motivo. |
| 1.2.7 | **Recargar datos** | Botón "Recargar" para actualizar el calendario en tiempo real. |
| 1.2.8 | **Ir a reservar** | Botón "Reservar esta fecha" si el día no tiene bloqueos. |

### 1.3 Inicio de Sesión (`/login`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1.3.1 | **Ingresar email** | Campo de texto para correo electrónico. |
| 1.3.2 | **Ingresar contraseña** | Campo de texto tipo password. |
| 1.3.3 | **Iniciar sesión** | Botón que autentica con Supabase Auth. |
| 1.3.4 | **Ver errores** | Mensaje de error si las credenciales son incorrectas. |
| 1.3.5 | **Navegar a registro** | Link "Regístrate aquí" para crear cuenta nueva. |
| 1.3.6 | **Redirección automática** | Tras login exitoso, redirige a `/dashboard`. |

### 1.4 Registro (`/register`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1.4.1 | **Ingresar nombre completo** | Campo obligatorio. |
| 1.4.2 | **Ingresar teléfono** | Campo obligatorio. |
| 1.4.3 | **Ingresar email** | Campo obligatorio, validación de formato. |
| 1.4.4 | **Ingresar contraseña** | Campo obligatorio. |
| 1.4.5 | **Crear cuenta** | Registro en Supabase Auth + creación automática de perfil en tabla `profiles`. |
| 1.4.6 | **Ver errores** | Mensaje si el email ya existe u otro error. |
| 1.4.7 | **Navegar a login** | Link "Inicia sesión" si ya tiene cuenta. |
| 1.4.8 | **Redirección a login** | Tras registro exitoso, redirige a `/login` para iniciar sesión. |

---

## 2. Usuario Registrado (role = 'user')

Usuario autenticado con rol `user`. Tiene acceso a todas las funcionalidades del visitante más las propias de usuario.

### 2.1 Navegación (Navbar)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 2.1.1 | **Ver "Mis Reservas"** | Link en navbar a `/dashboard`. |
| 2.1.2 | **Ver "Calendario"** | Link en navbar a `/calendario`. |
| 2.1.3 | **Cerrar sesión** | Botón "Cerrar Sesión" que elimina la sesión y redirige a `/`. |

### 2.2 Dashboard (`/dashboard`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 2.2.1 | **Ver listado de reservas** | Tarjetas con todas las reservas del usuario ordenadas por fecha (más reciente primero). |
| 2.2.2 | **Ver estado de reserva** | Badge con color: Pendiente (amarillo), Aprobada (verde), Rechazada (rojo). |
| 2.2.3 | **Ver detalle de reserva** | Cancha, fecha, horario (inicio-fin), ubicación. |
| 2.2.4 | **Ver comprobante** | Si subió comprobante de pago, aparece la URL del archivo. |
| 2.2.5 | **Nueva reserva** | Botón "Nueva Reserva" que lleva a `/reservar`. |
| 2.2.6 | **Estado vacío** | Si no tiene reservas, muestra mensaje + botón para ir a reservar. |

### 2.3 Reservar (`/reservar`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 2.3.1 | **Paso 1: Seleccionar cancha** | Lista de canchas activas con foto, nombre, tipo, precio socio y precio no socio. |
| 2.3.2 | **Paso 2: Seleccionar fecha** | Calendario interactivo. No permite seleccionar fechas pasadas. |
| 2.3.3 | **Paso 3: Seleccionar horarios** | Grilla de botones con slots de 1 hora (08:00 a 21:00). Solo muestra horarios disponibles. |
| 2.3.4 | **Selección consecutiva** | Solo permite seleccionar slots consecutivos (ej: 10:00 + 11:00). Si se salta, reinicia selección. |
| 2.3.5 | **Toggle socio / no socio** | En el resumen, botones para indicar si es socio del club. |
| 2.3.6 | **Cálculo de precio dinámico** | El total se recalcula automáticamente según tipo de usuario (socio/no socio) × cantidad de horas. |
| 2.3.7 | **Ver precio por hora** | En el resumen se muestra el precio unitario aplicado. |
| 2.3.8 | **Subir comprobante de pago** | Input file para subir imagen o PDF (obligatorio). |
| 2.3.9 | **Ver nombre del archivo** | Al seleccionar archivo, muestra el nombre del archivo seleccionado. |
| 2.3.10 | **Validación anti-overlap** | Antes de guardar, verifica que nadie haya reservado el mismo horario mientras el usuario seleccionaba. |
| 2.3.11 | **Validación anti-bloqueo** | Verifica que el horario no esté bloqueado por administración. |
| 2.3.12 | **Guardar en Supabase** | Crea la reserva con estado `pending` en la tabla `reservations`. |
| 2.3.13 | **Subir comprobante a Storage** | Si hay archivo, se sube al bucket `payment-proofs` y se guarda la URL pública. |
| 2.3.14 | **Pantalla de éxito** | Muestra confirmación visual con check verde, detalle de la reserva y botones para ir al dashboard o hacer otra reserva. |
| 2.3.15 | **Enviar email de pendiente** | Notificación por correo al usuario confirmando que su solicitud está pendiente de aprobación. |
| 2.3.16 | **Redirección si no está logueado** | Si un visitante intenta reservar sin sesión, muestra error y redirige a `/login` en 2 segundos. |

---

## 3. Administrador (role = 'admin')

Tiene acceso a todas las funcionalidades del usuario más el panel de administración.

### 3.1 Navegación (Navbar)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.1.1 | **Ver "Administración"** | Link en navbar a `/admin` (solo visible para admin/super_admin). |

### 3.2 Panel de Administración (`/admin`)

#### 3.2.1 Solicitudes Pendientes

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.2.1.1 | **Ver lista de pendientes** | Todas las reservas con estado `pending`, ordenadas por fecha de creación (más reciente primero). |
| 3.2.1.2 | **Ver datos del solicitante** | Nombre completo, email, teléfono del usuario. |
| 3.2.1.3 | **Ver detalle de la reserva** | Cancha, fecha, horario (inicio-fin). |
| 3.2.1.4 | **Ver total a pagar** | Monto total de la reserva con formato de moneda chilena. |
| 3.2.1.5 | **Ver comprobante de pago** | Link para abrir en nueva pestaña el archivo subido por el usuario. |
| 3.2.1.6 | **Aprobar reserva** | Botón verde que cambia estado a `approved`. Envía email de aprobación al usuario. |
| 3.2.1.7 | **Rechazar reserva** | Botón rojo que cambia estado a `rejected`. |
| 3.2.1.8 | **Contador de pendientes** | Muestra la cantidad de solicitudes pendientes en el título de la sección. |

#### 3.2.2 Bloquear Días / Horarios

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.2.2.1 | **Crear bloqueo** | Formulario para bloquear una cancha en un rango de fechas/horas. |
| 3.2.2.2 | **Seleccionar cancha** | Dropdown con todas las canchas disponibles. |
| 3.2.2.3 | **Fecha/hora inicio** | Campo `datetime-local` obligatorio. |
| 3.2.2.4 | **Fecha/hora fin** | Campo `datetime-local` obligatorio. |
| 3.2.2.5 | **Motivo** | Campo de texto opcional (ej: "Mantenimiento", "Evento"). |
| 3.2.2.6 | **Guardar bloqueo** | Inserta en tabla `availability_blocks`. |
| 3.2.2.7 | **Ver bloqueos activos** | Lista de los últimos 20 bloqueos creados con cancha, fechas y motivo. |
| 3.2.2.8 | **Eliminar bloqueo** | Botón para eliminar un bloqueo existente. |
| 3.2.2.9 | **Ver calendario público** | Link que abre `/calendario` en nueva pestaña. |

#### 3.2.3 Gestión de Canchas y Precios

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.2.3.1 | **Ver canchas** | Lista de todas las canchas con nombre y tipo. |
| 3.2.3.2 | **Editar precio socio** | Campo numérico para `price_member`. |
| 3.2.3.3 | **Editar precio no socio** | Campo numérico para `price_per_hour`. |
| 3.2.3.4 | **Activar/Desactivar cancha** | Checkbox para cambiar `is_active` (true/false). |
| 3.2.3.5 | **Guardar cambios** | Botón que actualiza los datos en la tabla `courts`. |

#### 3.2.4 Reservas Aprobadas

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.2.4.1 | **Ver lista de aprobadas** | Todas las reservas con estado `approved`. |
| 3.2.4.2 | **Ver datos del usuario** | Nombre del usuario que hizo la reserva. |
| 3.2.4.3 | **Ver detalle** | Cancha, fecha, horario. |
| 3.2.4.4 | **Contador** | Muestra la cantidad de reservas aprobadas. |

### 3.3 Notificaciones Toast

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 3.3.1 | **Toast de éxito** | Al aprobar/rechazar/eliminar/editar, muestra toast verde con mensaje. |
| 3.3.2 | **Toast de error** | Si algo falla, muestra toast rojo con el mensaje de error. |

---

## 4. Super Administrador (role = 'super_admin')

Tiene acceso a **todas** las funcionalidades del administrador más capacidades exclusivas de superadmin.

### 4.1 Panel de Administración (`/admin`) — Exclusivo Super Admin

#### 4.1.1 Editar Reservas Aprobadas

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 4.1.1.1 | **Editar fecha** | Campo `date` para cambiar la fecha de una reserva aprobada. |
| 4.1.1.2 | **Editar hora inicio** | Campo `time` para cambiar la hora de inicio. |
| 4.1.1.3 | **Editar hora fin** | Campo `time` para cambiar la hora de término. |
| 4.1.1.4 | **Guardar edición** | Botón que actualiza la reserva. Genera log de auditoría automáticamente. |

#### 4.1.2 Eliminar Reservas

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 4.1.2.1 | **Eliminar reserva** | Botón rojo "Eliminar" en reservas aprobadas. |
| 4.1.2.2 | **Confirmación implícita** | Al hacer clic, la reserva se elimina inmediatamente (sin modal de confirmación). |
| 4.1.2.3 | **Log de auditoría** | Al eliminar, se registra en `audit_logs` con acción `deleted_reservation`. |

#### 4.1.3 Auditoría (`/admin/auditoria`)

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 4.1.3.1 | **Ver logs de auditoría** | Tabla con todos los registros de `audit_logs`. |
| 4.1.3.2 | **Ver actor** | Usuario que realizó la acción (o `null` si es sistema). |
| 4.1.3.3 | **Ver acción** | Tipo de acción: `created_reservation`, `updated_reservation`, `deleted_reservation`, `edited_reservation`, etc. |
| 4.1.3.4 | **Ver target** | ID de la reserva afectada. |
| 4.1.3.5 | **Ver detalles** | JSON con datos antiguos y nuevos (para updates) o datos completos (para inserts/deletes). |
| 4.1.3.6 | **Ver fecha/hora** | Timestamp de cuándo ocurrió la acción. |
| 4.1.3.7 | **Orden descendente** | Logs ordenados del más reciente al más antiguo. |
| 4.1.3.8 | **Link desde admin** | Tarjeta en `/admin` con link a `/admin/auditoria`. |

### 4.2 Logs Automáticos (Triggers SQL)

Todos los cambios en reservas generan automáticamente registros en `audit_logs`:

| Evento | Acción registrada |
|--------|-------------------|
| Crear reserva | `created_reservation` |
| Actualizar estado | `updated_reservation` |
| Editar fecha/horario | `edited_reservation` |
| Eliminar reserva | `deleted_reservation` |
| Cambiar estado (admin) | `updated_reservation_status_to_approved/rejected` |

---

## Tabla Resumen por Rol

| Funcionalidad | Visitante | Usuario | Admin | Super Admin |
|---------------|:---------:|:-------:|:-----:|:-----------:|
| Landing Page | ✅ | ✅ | ✅ | ✅ |
| Calendario Público | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Registro | ✅ | ✅ | ✅ | ✅ |
| Mis Reservas (Dashboard) | ❌ | ✅ | ✅ | ✅ |
| Nueva Reserva | ❌ | ✅ | ✅ | ✅ |
| Subir comprobante de pago | ❌ | ✅ | ✅ | ✅ |
| Recibir emails (pending/approved) | ❌ | ✅ | ✅ | ✅ |
| Panel Admin | ❌ | ❌ | ✅ | ✅ |
| Aprobar/Rechazar reservas | ❌ | ❌ | ✅ | ✅ |
| Bloquear horarios | ❌ | ❌ | ✅ | ✅ |
| Gestionar precios de canchas | ❌ | ❌ | ✅ | ✅ |
| Ver reservas aprobadas | ❌ | ❌ | ✅ | ✅ |
| Editar reservas aprobadas | ❌ | ❌ | ❌ | ✅ |
| Eliminar reservas | ❌ | ❌ | ❌ | ✅ |
| Ver auditoría completa | ❌ | ❌ | ❌ | ✅ |

---

## Flujos de Trabajo Principales

### Flujo 1: Usuario hace una reserva

```
Visitante → /register → /login → /reservar
   ↓
Selecciona cancha → fecha → horarios → toggle socio/no socio
   ↓
Sube comprobante de pago → Confirma
   ↓
Reserva creada con estado "pending"
   ↓
Email automático: "Tu solicitud está pendiente de aprobación"
   ↓
Redirige a pantalla de éxito
```

### Flujo 2: Admin aprueba una reserva

```
Admin → /admin
   ↓
Ve solicitud pendiente con datos del usuario
   ↓
Click "Aprobar"
   ↓
Estado cambia a "approved"
   ↓
Email automático: "Tu reserva ha sido aprobada"
   ↓
Log de auditoría: updated_reservation_status_to_approved
   ↓
Aparece en calendario público como verde
```

### Flujo 3: Super Admin edita una reserva

```
Super Admin → /admin → Reservas Aprobadas
   ↓
Modifica fecha y/o horarios
   ↓
Click "Editar"
   ↓
Reserva actualizada en BD
   ↓
Log de auditoría: edited_reservation
   ↓
Toast de confirmación
```

---

## Notas Técnicas

- **Autenticación:** Supabase Auth con JWT.
- **Autorización:** Row Level Security (RLS) en PostgreSQL. Los roles se validan en el servidor (Server Actions).
- **Emails:** Resend API vía Supabase Edge Function (`send-email`).
- **Storage:** Supabase Storage bucket `payment-proofs` para comprobantes.
- **Auditoría:** Trigger PostgreSQL `reservation_audit_trigger` en tabla `reservations`.
- **Precios dual:** Columnas `price_per_hour` (no socio) y `price_member` (socio) en tabla `courts`.

---

**Documento generado:** Abril 2026  
**Versión:** 1.0
