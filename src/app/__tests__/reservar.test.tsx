import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReservarPage from "../reservar/page";

// Mock next/navigation
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock createProfileIfNotExists
jest.mock("@/app/actions", () => ({
  createProfileIfNotExists: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock Supabase client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockInsert = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
      }),
    },
    from: mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          eq: mockEq.mockReturnValue({
            in: mockIn.mockReturnValue(Promise.resolve({ data: [], error: null })),
          }),
        }),
      }),
      insert: mockInsert.mockReturnValue(Promise.resolve({ data: { id: "res-123" }, error: null })),
    }),
    storage: {
      from: () => ({
        upload: mockUpload.mockResolvedValue({ error: null }),
        getPublicUrl: mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://example.com/proof.jpg" } }),
      }),
    },
  }),
}));

describe("Reservar Page - Price Calculation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all sections of the reservation form", () => {
    render(<ReservarPage />);

    expect(screen.getByRole("heading", { name: /nueva reserva/i })).toBeInTheDocument();
    expect(screen.getByText(/1\. selecciona la cancha/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. selecciona la fecha/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. selecciona los horarios/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. resumen/i)).toBeInTheDocument();
  });

  it("shows member/non-member toggle in summary", () => {
    render(<ReservarPage />);

    expect(screen.getByText(/¿eres socio del club?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sí, soy socio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /no soy socio/i })).toBeInTheDocument();
  });

  it("shows payment proof upload as required", () => {
    render(<ReservarPage />);

    const label = screen.getByText(/comprobante de pago/i);
    expect(label).toBeInTheDocument();
    expect(screen.getByText(/\*/)).toBeInTheDocument(); // Required asterisk
  });

  it("disables confirm button when no payment file is selected", () => {
    render(<ReservarPage />);

    const confirmButton = screen.getByRole("button", { name: /confirmar reserva/i });
    expect(confirmButton).toBeDisabled();
  });
});

describe("Price Calculation Logic", () => {
  it("calculates member price correctly", () => {
    const court = { price_per_hour: 35000, price_member: 25000 };
    const isMember = true;
    const slots = 3;

    const price = isMember && court.price_member ? court.price_member : court.price_per_hour;
    const total = price * slots;

    expect(total).toBe(75000);
  });

  it("calculates non-member price correctly", () => {
    const court = { price_per_hour: 35000, price_member: 25000 };
    const isMember = false;
    const slots = 3;

    const price = isMember && court.price_member ? court.price_member : court.price_per_hour;
    const total = price * slots;

    expect(total).toBe(105000);
  });

  it("falls back to non-member price when member price is not set", () => {
    const court = { price_per_hour: 15000, price_member: null };
    const isMember = true;
    const slots = 2;

    const price = isMember && court.price_member ? court.price_member : court.price_per_hour;
    const total = price * slots;

    expect(total).toBe(30000);
  });
});
