import { render, screen } from "@testing-library/react";
import Home from "../page";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Landing Page", () => {
  it("renders the main heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        name: /reservas club deportivo minvu serviu/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the reservation button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /reservar ahora/i })).toBeInTheDocument();
  });

  it("renders the availability button", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: /ver disponibilidad/i })).toBeInTheDocument();
  });

  it("renders all 4 court cards", () => {
    render(<Home />);
    // Use heading queries to target card titles specifically
    expect(screen.getByRole("heading", { name: /cancha de fútbol/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cancha de tenis 1/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cancha de tenis 2/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /gimnasio polideportivo/i })).toBeInTheDocument();
  });

  it("renders member and non-member prices", () => {
    render(<Home />);
    expect(screen.getAllByText(/socio/i).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/no socio/i).length).toBeGreaterThanOrEqual(4);
  });

  it("renders the CTA section", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /¿listo para jugar?/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
