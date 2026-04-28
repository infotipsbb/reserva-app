# Sistema de Testing

> **Proyecto:** Club Deportivo Minvu Serviu  
> **Herramientas:** Jest + React Testing Library (Unitarios/Integración) + Playwright (E2E)

---

## ✅ Estado Actual

```
Test Suites: 6 passed, 6 total
Tests:       33 passed, 33 total
Snapshots:   0 total
```

---

## 📁 Estructura de Tests

```
reserva-app/
├── src/
│   ├── app/
│   │   ├── __tests__/
│   │   │   ├── page.test.tsx         # Tests Landing Page
│   │   │   ├── login.test.tsx        # Tests Login
│   │   │   ├── register.test.tsx     # Tests Registro
│   │   │   └── reservar.test.tsx     # Tests Reserva (precios)
│   ├── config/
│   │   └── __tests__/
│   │       └── assets.test.ts        # Tests configuración de precios
│   └── lib/
│       └── __tests__/
│           └── utils.test.ts         # Tests utilidades y cálculos
├── e2e/
│   └── landing.spec.ts               # Tests E2E con Playwright
├── jest.config.ts                    # Configuración Jest
├── jest.setup.ts                     # Setup global (mocks)
└── playwright.config.ts              # Configuración Playwright
```

---

## 🧪 Tests Unitarios / Integración (Jest)

### Ejecutar en modo watch (desarrollo)

```bash
npm test
```

### Ejecutar una sola vez (CI/CD)

```bash
npm run test:ci
```

### Ejecutar un archivo específico

```bash
npx jest src/app/__tests__/login.test.tsx
```

### Tests implementados

| Archivo | # Tests | Qué valida |
|---------|---------|------------|
| `page.test.tsx` | 6 | Landing Page: título, botones, tarjetas de canchas, precios, CTA |
| `login.test.tsx` | 5 | Login: campos, errores, redirección, estado de carga |
| `register.test.tsx` | 4 | Registro: campos, errores, redirección a login |
| `reservar.test.tsx` | 6 | Reserva: secciones, toggle socio, comprobante obligatorio, cálculo de precios |
| `assets.test.ts` | 5 | Config: 4 canchas, precios válidos, precio socio < no socio |
| `utils.test.ts` | 7 | Utilidades: formato de fecha, cálculo de precios, fallback |

**Total: 33 tests unitarios**

---

## 🎭 Tests End-to-End (Playwright)

### Instalar navegadores (primera vez)

```bash
npx playwright install
```

### Ejecutar tests E2E (headless)

```bash
npm run test:e2e
```

### Ejecutar con UI interactiva

```bash
npm run test:e2e:ui
```

### Tests E2E implementados

| Suite | # Tests | Qué valida |
|-------|---------|------------|
| Landing Page | 5 | Título, navegación, precios, links |
| Authentication Flow | 4 | Login, registro, errores, navegación entre páginas |
| Calendar Page | 3 | Calendario, leyenda, selector de canchas |
| Responsive Design | 2 | Menú hamburguesa, usabilidad en móvil |

**Total: 14 tests E2E** (en 4 navegadores: Chrome, Firefox, Safari, móvil)

---

## 🔧 Configuración Técnica

### Jest (`jest.config.ts`)

- **Environment:** `jsdom` (simula navegador)
- **Setup:** `jest.setup.ts` con mocks de `matchMedia`, `IntersectionObserver`, `scrollTo`
- **Module mapping:** `@/` → `src/`
- **Ignora:** `node_modules`, `.next`, `e2e`

### Playwright (`playwright.config.ts`)

- **Base URL:** `http://localhost:3000`
- **Navegadores:** Chrome, Firefox, Safari
- **Móvil:** Pixel 5, iPhone 12
- **Auto-start:** Levanta `npm run dev` automáticamente
- **Reporter:** HTML + screenshots en fallo

---

## 📝 Cómo agregar nuevos tests

### Test unitario de componente

```tsx
import { render, screen } from "@testing-library/react";
import MiComponente from "../mi-componente";

describe("MiComponente", () => {
  it("renderiza correctamente", () => {
    render(<MiComponente />);
    expect(screen.getByText(/texto esperado/i)).toBeInTheDocument();
  });
});
```

### Test con interacción de usuario

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Formulario", () => {
  it("envía datos al hacer submit", async () => {
    render(<Formulario />);
    
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));
    
    expect(await screen.findByText(/éxito/i)).toBeInTheDocument();
  });
});
```

### Test E2E con Playwright

```ts
import { test, expect } from "@playwright/test";

test("usuario puede reservar", async ({ page }) => {
  await page.goto("/reservar");
  await page.click("text=Cancha de Fútbol");
  await page.click("text=12:00");
  // ... más pasos
  await expect(page.getByText(/reserva solicitada/i)).toBeVisible();
});
```

---

## 🎯 Buenas prácticas

1. **Mockear servicios externos** (Supabase, APIs) en tests unitarios
2. **Usar `screen` queries semánticas**: `getByRole`, `getByLabelText`, `getByText`
3. **Evitar `getByTestId`**: solo como último recurso
4. **Limpiar mocks** en `beforeEach` para aislar tests
5. **Tests E2E**: probar flujos críticos del usuario, no implementación interna

---

## 🚀 Integración con CI/CD

Para ejecutar en GitHub Actions o similar:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:ci
  
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

**¿Necesitas agregar más tests para alguna funcionalidad específica?**
