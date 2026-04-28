import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle(/Reservas Club Deportivo Minvu Serviu/);
    await expect(
      page.getByRole("heading", { name: /Reservas Club Deportivo Minvu Serviu/i })
    ).toBeVisible();
  });

  test("has navigation buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Reservar Ahora/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Ver Disponibilidad/i })).toBeVisible();
  });

  test("displays all court cards with prices", async ({ page }) => {
    await expect(page.getByText(/Cancha de Fútbol/i)).toBeVisible();
    await expect(page.getByText(/Cancha de Tenis 1/i)).toBeVisible();
    await expect(page.getByText(/Cancha de Tenis 2/i)).toBeVisible();
    await expect(page.getByText(/Gimnasio Polideportivo/i)).toBeVisible();

    // Check for price labels
    await expect(page.getByText(/Socio/i).first()).toBeVisible();
    await expect(page.getByText(/No socio/i).first()).toBeVisible();
  });

  test("navigates to calendar page", async ({ page }) => {
    await page.getByRole("button", { name: /Ver Disponibilidad/i }).click();
    await expect(page).toHaveURL(/.*calendario/);
    await expect(page.getByRole("heading", { name: /Disponibilidad de Canchas/i })).toBeVisible();
  });

  test("navigates to register page from CTA", async ({ page }) => {
    await page.getByRole("button", { name: /Crear Cuenta/i }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole("heading", { name: /Crear Cuenta/i })).toBeVisible();
  });
});

test.describe("Authentication Flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Iniciar Sesión/i })).toBeVisible();
    await expect(page.getByLabelText(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByLabelText(/Contraseña/i)).toBeVisible();
  });

  test("register page loads correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Crear Cuenta/i })).toBeVisible();
    await expect(page.getByLabelText(/Nombre completo/i)).toBeVisible();
    await expect(page.getByLabelText(/Teléfono/i)).toBeVisible();
    await expect(page.getByLabelText(/Correo electrónico/i)).toBeVisible();
    await expect(page.getByLabelText(/Contraseña/i)).toBeVisible();
  });

  test("shows error on invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabelText(/Correo electrónico/i).fill("test@example.com");
    await page.getByLabelText(/Contraseña/i).fill("wrongpassword");
    await page.getByRole("button", { name: /Ingresar/i }).click();

    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible();
  });

  test("can navigate from login to register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Regístrate aquí/i }).click();
    await expect(page).toHaveURL(/.*register/);
  });
});

test.describe("Calendar Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendario");
  });

  test("displays calendar and legend", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Disponibilidad de Canchas/i })).toBeVisible();
    await expect(page.getByText(/Disponible/i)).toBeVisible();
    await expect(page.getByText(/Pendiente/i)).toBeVisible();
    await expect(page.getByText(/Aprobada/i)).toBeVisible();
    await expect(page.getByText(/Bloqueado/i)).toBeVisible();
  });

  test("has court selector dropdown", async ({ page }) => {
    const selector = page.locator("select");
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue("all");
  });

  test("has reload button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Recargar/i })).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("navbar shows hamburger menu on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // On mobile, the nav links should be hidden and hamburger shown
    await expect(page.locator("button[aria-label='Toggle menu']")).toBeVisible();
  });

  test("landing page is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Reservas Club Deportivo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reservar Ahora/i })).toBeVisible();
  });
});
