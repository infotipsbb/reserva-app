# Guía: Cómo Subir Imágenes Reales y Actualizar la App

Este documento explica paso a paso cómo subir las fotos reales de las instalaciones del club y actualizarlas en la aplicación.

---

## Opción 1: Google Drive (Recomendada si ya usas Google)

### Paso 1: Subir la imagen a Google Drive

1. Ve a [drive.google.com](https://drive.google.com) e inicia sesión.
2. Arrastra las fotos a tu Drive o haz clic en **Nuevo > Subir archivo**.
3. Haz **clic derecho** sobre la imagen subida y selecciona **Compartir**.
4. En la ventana de compartir, cambia el acceso a **Cualquiera con el enlace** (rol: Lector).
5. Copia el enlace. Se verá algo así:
   ```
   https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
   ```

### Paso 2: Obtener el enlace directo a la imagen

El enlace de Google Drive no sirve directamente para la web. Debes convertirlo a un enlace directo.

1. Extrae el **ID** del archivo del enlace. Es la parte larga entre `/d/` y `/view`:
   ```
   https://drive.google.com/file/d/1ABC123xyz/view?usp=sharing
                                   ^^^^^^^^^^^
                                   Este es el ID
   ```

2. Construye el enlace directo con este formato:
   ```
   https://lh3.googleusercontent.com/d/1ABC123xyz=w800
   ```
   - Reemplaza `1ABC123xyz` con el ID real de tu archivo.
   - `=w800` al final define el ancho en píxeles (puedes cambiarlo a `=w1200`, `=w1600`, etc.).

### Paso 3: Probar el enlace

Pega el enlace directo en el navegador. Debería abrir solo la imagen, sin la interfaz de Drive.

---

## Opción 2: Imgur (Rápida y gratuita)

1. Ve a [imgur.com](https://imgur.com).
2. Haz clic en el botón verde **New post** y sube tu imagen.
3. Una vez subida, haz clic derecho sobre la imagen y selecciona **"Copiar dirección de imagen"**.
4. La URL se verá algo así:
   ```
   https://i.imgur.com/AbCdEfG.jpg
   ```

> **Nota:** Imgur es gratuito y no requiere configuración adicional en Next.js.

---

## Opción 3: Cloudinary (Profesional y escalable)

Si planeas subir muchas imágenes o necesitas optimización avanzada:

1. Crea una cuenta gratuita en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard, verás tu **Cloud Name**.
3. Ve a **Media Library > Upload** y sube tus fotos.
4. Haz clic en la imagen y copia la URL de entrega (Delivery URL):
   ```
   https://res.cloudinary.com/TU_CLOUD_NAME/image/upload/v1234567890/nombre-imagen.jpg
   ```

> **Nota:** Cloudinary optimiza automáticamente el tamaño y formato de las imágenes.

---

## Dónde cambiar las URLs en el código

Todas las imágenes de la aplicación se configuran en un solo archivo:

### Archivo: `src/config/assets.ts`

```typescript
export const assets = {
  hero: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600&q=80",
  canchaFutbol: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80",
  gimnasio: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
};

export const prices = [
  {
    court: "Cancha de Fútbol",
    priceNonMember: 35000,
    priceMember: 25000,
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&q=80",
    description: "Cancha reglamentaria de fútbol 11 con césped sintético.",
  },
  {
    court: "Cancha de Tenis 1",
    priceNonMember: 15000,
    priceMember: 10000,
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
    description: "Cancha de tenis con superficie de polvo de ladrillo.",
  },
  {
    court: "Cancha de Tenis 2",
    priceNonMember: 15000,
    priceMember: 10000,
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
    description: "Cancha de tenis con superficie de polvo de ladrillo.",
  },
  {
    court: "Gimnasio Polideportivo",
    priceNonMember: 25000,
    priceMember: 18000,
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
    description: "Espacio multiuso ideal para baby fútbol, básquetbol o voleibol.",
  },
];
```

### ¿Qué reemplazar?

| Variable | Ubicación en la app | Descripción |
|----------|---------------------|-------------|
| `assets.hero` | Fondo grande de la página de inicio (Landing Page) | Foto panorámica del club o canchas |
| `assets.canchaFutbol` | Galería de instalaciones (sección "Nuestras Instalaciones") | Foto de la cancha de fútbol |
| `assets.gimnasio` | Galería de instalaciones | Foto del gimnasio polideportivo |
| `prices[0].image` | Tarjeta de "Cancha de Fútbol" | Foto de la cancha de fútbol |
| `prices[1].image` | Tarjeta de "Cancha de Tenis 1" | Foto de la cancha de tenis |
| `prices[2].image` | Tarjeta de "Cancha de Tenis 2" | Foto de la cancha de tenis (puede ser la misma) |
| `prices[3].image` | Tarjeta de "Gimnasio Polideportivo" | Foto del gimnasio |

### Ejemplo: reemplazar con Google Drive

```typescript
export const assets = {
  hero: "https://lh3.googleusercontent.com/d/1ABC123xyz=w1600",
  canchaFutbol: "https://lh3.googleusercontent.com/d/1DEF456uvw=w800",
  gimnasio: "https://lh3.googleusercontent.com/d/1GHI789rst=w800",
};

export const prices = [
  {
    court: "Cancha de Fútbol",
    priceNonMember: 35000,
    priceMember: 25000,
    image: "https://lh3.googleusercontent.com/d/1DEF456uvw=w600",
    description: "Cancha reglamentaria de fútbol 11 con césped sintético.",
  },
  // ... resto de canchas
];
```

---

## Configuración adicional si usas Google Drive o Cloudinary

Si las URLs de las imágenes no son de `images.unsplash.com`, debes agregar el dominio a Next.js para que las optimice.

### Archivo: `next.config.ts`

Abre `next.config.ts` en la raíz del proyecto y agrega el dominio en `remotePatterns`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // 👇 Agrega esto si usas Google Drive
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // 👇 Agrega esto si usas Imgur
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      // 👇 Agrega esto si usas Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
```

> **Nota:** Si usas Imgur, Google Drive o Cloudinary, el dominio ya está agregado en el ejemplo anterior. Solo verifica que esté en tu archivo.

---

## Paso final: Reconstruir y publicar

Después de cambiar las URLs, debes compilar la aplicación de nuevo para que los cambios se apliquen.

### En tu computadora (desarrollo)

```bash
npm run build
npm start
```

### Si usas Vercel (producción)

1. Sube los cambios a tu repositorio de Git (GitHub/GitLab/Bitbucket).
2. Vercel detectará automáticamente los cambios y hará un nuevo despliegue.

### Si usas otro servidor

1. Ejecuta `npm run build`.
2. Sube la carpeta resultante al servidor (o usa el sistema de despliegue que corresponda).

---

## Resumen rápido (checklist)

- [ ] Subir fotos reales a Google Drive / Imgur / Cloudinary.
- [ ] Obtener el enlace directo de cada imagen.
- [ ] Abrir `src/config/assets.ts`.
- [ ] Reemplazar las URLs en `assets` y `prices`.
- [ ] Verificar que el dominio esté en `next.config.ts` (solo si cambias de servicio).
- [ ] Ejecutar `npm run build`.
- [ ] Recargar la página (`Ctrl + F5`) para ver los cambios.

---

## ¿Problemas comunes?

| Problema | Solución |
|----------|----------|
| **Error 404** en la imagen | Revisa que el enlace sea directo (la URL debe terminar en `.jpg`, `.png` o similar, o usar el formato de Google Drive `lh3.googleusercontent.com`). |
| **Error 400** | El dominio de la imagen no está autorizado en `next.config.ts`. Agrega el `hostname` en `remotePatterns`. |
| **La imagen no cambia** | El navegador guarda caché. Presiona `Ctrl + F5` para recargar sin caché. |
| **La imagen se ve muy grande** | Ajusta el parámetro `=w800` al final de la URL de Google Drive o usa `?w=800&q=80` en Unsplash/Imgur. |

---

**¿Necesitas ayuda para subir las fotos reales del club?** Puedes enviarme los enlaces de Google Drive y yo actualizo el código por ti.
