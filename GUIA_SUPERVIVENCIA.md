# Guía de Supervivencia — Proyecto Reservas CD Minvu Serviu Biobío

> **Fecha:** Abril 2026  
> **Proyecto:** Sistema de reservas de canchas deportivas  
> **URL Producción:** https://reserva-app-ruby.vercel.app/  
> **Repositorio:** https://github.com/infotipsbb/reserva-app

---

## 1. Retomar el Proyecto (después de cerrar todo)

Abre **PowerShell** o **CMD** y ejecuta estos comandos en orden:

```powershell
# 1. Ir a la carpeta del proyecto
cd "C:\Users\Andres Ramirez\Documents\REVISAR\reserva-app"

# 2. Verificar estado de Git
git status

# 3. Iniciar servidor de desarrollo local
npm run dev
```

Abre tu navegador en: `http://localhost:3000`

> El servidor quedará corriendo en la terminal. No cierres esa ventana mientras desarrolles.

---

## 2. Hacer Cambios y Subirlos a Producción

### Flujo completo paso a paso

```powershell
# Paso 1: Editar archivos con VS Code, Notepad o cualquier editor

# Paso 2: Verificar que compila sin errores
npm run build

# Paso 3: Guardar cambios en Git (control de versiones)
git add .
git commit -m "descripcion del cambio"

# Paso 4: Subir a GitHub
# Vercel detecta automáticamente el push y hace deploy en ~1 minuto
git push origin main
```

### Esperar el deploy

Después del `git push`, espera aproximadamente **1 minuto** y recarga:

```
https://reserva-app-ruby.vercel.app/
```

---

## 3. Dónde Están las Cosas Importantes

### Páginas principales

| Quiero cambiar... | Archivo | Notas |
|-------------------|---------|-------|
| **Textos de la Landing Page** | `src/app/page.tsx` | Hero, canchas, precios (ahora dinámicos desde BD) |
| **Textos de Login** | `src/app/login/page.tsx` | Formulario de inicio de sesión |
| **Textos de Registro** | `src/app/register/page.tsx` | Formulario de creación de cuenta |
| **Textos del Dashboard** | `src/app/dashboard/page.tsx` | "Mis Reservas" del usuario |
| **Textos del Panel Admin** | `src/app/admin/page.tsx` | Gestión de reservas, bloqueos, precios |
| **Textos del Calendario** | `src/app/calendario/page.tsx` | Calendario público de disponibilidad |
| **Menú de navegación** | `src/components/navbar.tsx` | Navbar con menú hamburguesa móvil |
| **Colores y estilos globales** | `src/app/globals.css` | Variables CSS, tema, Tailwind |

### Configuración y datos

| Quiero cambiar... | Archivo / Carpeta | Notas |
|-------------------|-------------------|-------|
| **Precios de canchas** | Desde `/admin` en la app | NO editar código. Se guardan en la BD |
| **Imágenes de canchas** | `src/config/assets.ts` | URLs de Unsplash o subir fotos reales |
| **Base de datos (SQL)** | `init.sql` | Esquema completo de tablas |
| **Migraciones SQL** | `supabase/migrations/` | Scripts de cambios en la BD |
| **Tests unitarios** | `src/app/__tests__/` | Jest + React Testing Library |
| **Tests E2E** | `e2e/` | Playwright |
| **Variables de entorno** | `.env.local` | **NO subir a Git** (está en `.gitignore`) |

---

## 4. Ejecutar Tests

```powershell
# Tests unitarios en modo watch (para desarrollo)
npm test

# Tests unitarios una sola vez (para CI/CD)
npm run test:ci

# Tests End-to-End con Playwright (requiere servidor corriendo)
npm run test:e2e
```

---

## 5. Reinstalar Dependencias (si algo se rompe)

```powershell
# Limpiar todo
rd /s /q node_modules
rd /s /q .next

# Reinstalar
npm install

# Verificar build
npm run build

# Iniciar servidor
npm run dev
```

---

## 6. Links Importantes (Guardar en favoritos)

| Servicio | URL | Para qué sirve |
|----------|-----|----------------|
| **App en producción** | https://reserva-app-ruby.vercel.app/ | La app que usan los usuarios |
| **Repositorio GitHub** | https://github.com/infotipsbb/reserva-app | Código fuente |
| **Panel de Supabase** | https://supabase.com/dashboard/project/tearpshutyhtdirnwsxl | Base de datos, Auth, Storage |
| **Panel de Vercel** | https://vercel.com/dashboard | Deploys, logs, variables de entorno |
| **Resend (emails)** | https://resend.com | Envío de correos |

---

## 7. Recordatorios Clave

### Seguridad

- **`.env.local`** contiene claves secretas (Supabase, Resend). **NUNCA** lo subas a GitHub. Ya está protegido por `.gitignore`.
- Si cambias las claves de Supabase, actualiza también las **variables de entorno en Vercel**.

### Base de datos

- Los **precios** se editan desde el panel `/admin` de la app. No es necesario tocar código.
- Si editas tablas o políticas en Supabase manualmente, **documenta el SQL** en `supabase/migrations/`.
- Siempre haz **backup** antes de ejecutar SQL destructivo en producción.

### Deploy

- Vercel se actualiza **automáticamente** cuando haces `git push origin main`.
- Si el build falla, revisa los logs en **Vercel Dashboard** → tu proyecto → **Deployments**.

### Imágenes

- Actualmente usamos imágenes de **Unsplash**.
- Para subir fotos reales del club, sigue la guía en `GUIA_IMAGENES.md`.

---

## 8. Solución de Problemas Comunes

### "No se ven los cambios en producción"

1. Verifica que hiciste `git push origin main`.
2. Espera 1-2 minutos.
3. Recarga con `Ctrl + F5` (limpia caché del navegador).
4. Revisa en Vercel Dashboard si el deploy fue exitoso.

### "Error al compilar (npm run build)"

1. Verifica que no haya errores de TypeScript en la consola.
2. Si hay errores de tipos, corrígelos antes de hacer commit.

### "La app no carga en local"

1. Verifica que el servidor esté corriendo (`npm run dev`).
2. Asegúrate de que el archivo `.env.local` existe con las variables correctas.

### "Email logins are disabled" o "Email not confirmed"

1. Ve a **Supabase** → **Authentication** → **Providers** → **Email**.
2. Activa: **Enable Email Provider**, **Enable Sign in**, **Enable Signup**.
3. Desactiva: **Confirm email**.

---

## 9. Estructura del Proyecto

```
reserva-app/
├── src/
│   ├── app/                    ← Páginas de Next.js
│   │   ├── page.tsx            ← Landing Page (dinámica desde BD)
│   │   ├── login/page.tsx      ← Login
│   │   ├── register/page.tsx   ← Registro
│   │   ├── dashboard/page.tsx  ← Mis Reservas
│   │   ├── reservar/page.tsx   ← Formulario de reserva
│   │   ├── calendario/page.tsx ← Calendario público
│   │   ├── admin/page.tsx      ← Panel de administración
│   │   └── layout.tsx          ← Layout global (SEO, favicon, navbar)
│   ├── components/             ← Componentes reutilizables
│   │   ├── navbar.tsx          ← Menú de navegación
│   │   └── ui/                 ← Botones, inputs, cards (shadcn)
│   ├── config/
│   │   └── assets.ts           ← Imágenes y descripciones fallback
│   └── lib/                    ← Utilidades y clientes Supabase
├── supabase/
│   ├── migrations/             ← Scripts SQL para la BD
│   └── functions/              ← Edge Functions (emails)
├── e2e/                        ← Tests E2E con Playwright
├── public/                     ← Archivos estáticos
├── .env.local                  ← Variables de entorno (NO subir a Git)
├── next.config.ts              ← Configuración de Next.js
├── package.json                ← Dependencias y scripts
└── README.md                   ← Documentación básica
```

---

## 10. Comandos Útiles Rápidos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Inicia servidor de desarrollo local |
| `npm run build` | Compila para producción (verifica errores) |
| `npm run start` | Inicia servidor de producción local |
| `npm test` | Ejecuta tests unitarios en modo watch |
| `npm run test:ci` | Ejecuta tests unitarios una vez |
| `npm run test:e2e` | Ejecuta tests E2E con Playwright |
| `git status` | Ver estado de cambios |
| `git add .` | Preparar todos los cambios para commit |
| `git commit -m "mensaje"` | Guardar cambios en Git |
| `git push origin main` | Subir cambios a GitHub (dispara deploy en Vercel) |
| `git log --oneline -5` | Ver últimos 5 commits |

---

## 11. Contacto y Soporte

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Resend Docs:** https://resend.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

---

> **Guarda este archivo en un lugar seguro.** Si necesitas retomar el proyecto después de cerrar todo, esta guía tiene todo lo que necesitas.

---

**Generado:** Abril 2026  
**Versión:** 1.0
