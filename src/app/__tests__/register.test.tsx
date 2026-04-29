import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../register/page";

// Mock next/navigation
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
    },
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

describe("Register Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders registration form with all fields", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("heading", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("link", { name: /inicia sesión/i })).toHaveAttribute("href", "/login");
  });

  it("displays error on failed registration", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: null,
      error: { message: "User already registered" },
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
    await userEvent.type(screen.getByLabelText(/teléfono/i), "+56912345678");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument();
    });
  });

  it("redirects to dashboard on successful registration and auto-login", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "123", email: "test@example.com" } },
      error: null,
    });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "123", email: "test@example.com" } },
      error: null,
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
    await userEvent.type(screen.getByLabelText(/teléfono/i), "+56912345678");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows success message when email confirmation is required", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "123", email: "test@example.com" } },
      error: null,
    });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Email not confirmed" },
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
    await userEvent.type(screen.getByLabelText(/teléfono/i), "+56912345678");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/revisa tu correo electrónico y haz clic en el enlace de confirmación/i)
      ).toBeInTheDocument();
    });
  });

  it("displays error when auto-login fails for other reasons", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "123", email: "test@example.com" } },
      error: null,
    });

    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    render(<RegisterPage />);

    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
    await userEvent.type(screen.getByLabelText(/teléfono/i), "+56912345678");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password123");
    fireEvent.click(screen.getByRole("button", { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });
});
