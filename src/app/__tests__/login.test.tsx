import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../login/page";

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Supabase client
const mockSignIn = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
    },
  }),
}));

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form with all fields", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
  });

  it("shows link to register page", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: /regístrate aquí/i })).toHaveAttribute("href", "/register");
  });

  it("displays error message on failed login", async () => {
    mockSignIn.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /ingresar/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpassword");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it("redirects to dashboard on successful login", async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /ingresar/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("disables submit button while loading", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole("button", { name: /ingresar/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/ingresando.../i)).toBeInTheDocument();
    });
  });
});
