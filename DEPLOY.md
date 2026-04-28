# Guía de Despliegue a Producción

> **Última actualización:** Abril 2026
> **Proyecto:** Reservas Club Deportivo Minvu Serviu

---

## ⚠️ CHECKLIST DE SEGURIDAD (Antes de deployar)

- [ ] `.env.local` NUNCA está subido a Git (verificar `.gitignore` tiene `.env*`)
- [ ] `.env.local.example` NO contiene claves reales (solo placeholders)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend/Edge Functions
- [ ] `RESEND_API_KEY` empieza con `re_` y es válida
- [ ] Se ejecutó `npm audit` y no hay vulnerabilidades críticas

---

## 1. Preparar el Proyecto Local

### 1.1 Verificar build local

```bash
npm run build
```

Debe terminar sin errores de TypeScript ni de compilación.

### 1.2 Verificar que no hay dependencias rotas

```bash
npm audit
```

Debe decir `found 0 vulnerabilities`. Si hay, ejecutar:

```bash
npm audit fix
```

---

## 2. Configurar Supabase Cloud (Base de Datos)

### 2.1 Crear proyecto (si no existe)

1. Ve a [supabase.com](https://supabase.com) e inicia sesión.
2. Crea un nuevo proyecto o usa el existente.
3. Anota tu **Project URL** y **Anon Key** (Configuración > API).

### 2.2 Ejecutar SQL de inicialización

Ve al **SQL Editor** de Supabase y ejecuta en orden:

```sql
-- 1. Esquema base + tablas + RLS + seed data
-- Copiar contenido de: init.sql

-- 2. Triggers y seed data
-- Copiar contenido de: supabase/migrations/002_triggers_and_seed.sql

-- 3. Eliminar triggers de email obsoletos (si existen)
-- Copiar contenido de: supabase/migrations/004_remove_email_triggers.sql

-- 4. Agregar columna price_member para precios de socio
-- Copiar contenido de: supabase/migrations/005_add_member_price.sql
```

> **Nota:** Si ya tienes datos en producción, haz backup primero (Database > Backups).

### 2.3 Configurar Storage (Bucket de comprobantes)

1. Ve a **Storage** en el panel de Supabase.
2. Crea un nuevo bucket llamado: `payment-proofs`
3. Configura las políticas de acceso:
   - **Público:** Sí (para que los admins puedan ver los comprobantes)
   - **RLS:** Habilitado
   - **Política de subida:** Usuarios autenticados pueden subir a su propia carpeta

Política SQL recomendada para subidas:

```sql
CREATE POLICY "Users can upload their own payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 2.4 Verificar tablas y datos

Después de ejecutar el SQL, verifica en **Table Editor**:

- `profiles` - debe tener al menos tu usuario admin
- `courts` - deben estar las 4 canchas con precios socio/no socio
- `reservations` - vacía inicialmente
- `availability_blocks` - vacía inicialmente
- `audit_logs` - vacía inicialmente

---

## 3. Configurar Resend (Emails)

### 3.1 Crear cuenta y verificar dominio

1. Ve a [resend.com](https://resend.com) y crea una cuenta.
2. Ve a **Domains** y añade tu dominio (ej: `clubminvu.cl`).
3. Verifica el dominio siguiendo las instrucciones de DNS.
4. Una vez verificado, copia tu **API Key** (empieza con `re_`).

### 3.2 Actualizar Edge Function de Supabase

1. Instala Supabase CLI (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

2. Inicia sesión:
   ```bash
   supabase login
   ```

3. Enlaza tu proyecto:
   ```bash
   supabase link --project-ref tearpshutyhtdirnwsxl
   ```
   > Reemplaza `tearpshutyhtdirnwsxl` con tu Project Reference ID real.

4. Configura el secreto de Resend en la Edge Function:
   ```bash
   supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
   ```

5. Despliega la Edge Function:
   ```bash
   supabase functions deploy send-email
   ```

### 3.3 Actualizar remitente en el código (opcional pero recomendado)

Abre `supabase/functions/send-email/index.ts` y cambia la línea:

```typescript
from: "Reservas Club Deportivo <onboarding@resend.dev>",
```

Por tu dominio verificado:

```typescript
from: "Reservas Club Deportivo <reservas@clubminvu.cl>",
```

> **Nota:** `onboarding@resend.dev` solo funciona para enviar a tu propio email. Para enviar a cualquier usuario, necesitas un dominio verificado.

---

## 4. Variables de Entorno en Vercel (u otro host)

### 4.1 Subir código a GitHub

```bash
git init
git add .
git commit -m "Ready for production"
git branch -M main
git remote add origin https://github.com/tu-usuario/reserva-app.git
git push -u origin main
```

> **ADVERTENCIA:** Antes de hacer `git add .`, verifica que `.env.local` NO esté en el staging:
> ```bash
> git status
> ```
> Si aparece `.env.local`, agrégalo al `.gitignore` y haz:
> ```bash
> git rm --cached .env.local
> ```

### 4.2 Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) e importa tu repositorio.
2. En **Environment Variables**, añade:

| Variable | Valor | ¿Pública? |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (anon key) | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (service role) | ❌ NO |
| `RESEND_API_KEY` | `re_...` | ❌ NO |

3. Framework Preset: **Next.js**
4. Build Command: `npm run build` (por defecto)
5. Output Directory: `.next` (por defecto)
6. Deploy.

### 4.3 Si usas otro host (Railway, DigitalOcean, etc.)

Crea un archivo `.env` en el servidor con las mismas variables. El `output: 'standalone'` en `next.config.ts` genera una carpeta `standalone/` dentro de `.next/` con todo lo necesario para ejecutar con Node.js:

```bash
npm run build
# Luego sube la carpeta .next/standalone/ al servidor
node server.js
```

---

## 5. Post-Deploy: Verificaciones

### 5.1 Probar flujo completo

1. **Registro:** Crea una cuenta nueva.
2. **Login:** Inicia sesión.
3. **Reserva:** Ve a `/reservar` y haz una reserva de prueba.
4. **Email:** Verifica que llegue el correo de "pendiente" a tu inbox.
5. **Admin:** Ve a `/admin`, aprueba la reserva.
6. **Email aprobado:** Verifica que llegue el correo de "aprobada".
7. **Calendario:** Ve a `/calendario` y verifica que la fecha aparezca en verde.
8. **Dashboard:** Ve a `/dashboard` y verifica que la reserva aparezca como aprobada.

### 5.2 Verificar consola del navegador

Abre DevTools (`F12`) y revisa:
- No debe haber errores 404 en imágenes.
- No debe haber errores de CORS.
- No debe haber warnings de React (key props, etc.).

### 5.3 Verificar Supabase

Ve a Supabase > Logs > Edge Functions y verifica:
- La función `send-email` se ejecuta sin errores.
- Los emails se envían correctamente.

---

## 6. Mantenimiento y Monitoreo

### 6.1 Logs importantes

| Servicio | Dónde ver logs |
|----------|----------------|
| Next.js | Vercel Dashboard > Logs |
| Supabase DB | Supabase > Logs > Postgres |
| Edge Functions | Supabase > Logs > Edge Functions |
| Emails | Resend Dashboard > Logs |

### 6.2 Backups automáticos

En Supabase > Database > Backups:
- Los backups diarios están incluidos en el plan gratuito.
- Para producción real, considera el plan Pro ($25/mes) para PITR (Point-in-Time Recovery).

### 6.3 Actualizaciones de seguridad

Revisa mensualmente:

```bash
npm audit
```

Y actualiza dependencias críticas:

```bash
npm update
```

---

## 7. Solución de Problemas Comunes

### Emails no llegan
1. Verifica en Resend Dashboard > Logs si hay errores.
2. Revisa en Supabase Edge Functions Logs si la función falla.
3. Si usas `onboarding@resend.dev`, solo puedes enviar a tu propio email. Verifica un dominio real.

### Imágenes no cargan
1. Verifica que el dominio esté en `next.config.ts` > `images.remotePatterns`.
2. Si usas Supabase Storage, asegúrate de que el bucket sea público o tenga RLS correcto.

### Error 500 al reservar
1. Verifica que la tabla `profiles` tenga el perfil del usuario (se crea automáticamente al registrarse).
2. Revisa Vercel Logs para ver el error exacto.

### No puedo acceder a `/admin`
1. Verifica que tu usuario tenga `role = 'admin'` o `'super_admin'` en la tabla `profiles`.
2. La asignación de admin se debe hacer manualmente en Supabase Table Editor.

---

## 8. Contacto y Soporte

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

---

**¿Listo para deployar?** Sigue este checklist en orden y tu app estará en producción en minutos.
