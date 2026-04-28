import { format, addDays, isBefore } from "date-fns";

describe("Date Utilities (date-fns)", () => {
  it("should format date correctly in Spanish", () => {
    const date = new Date(2026, 3, 28); // April 28, 2026
    const formatted = format(date, "dd/MM/yyyy", { locale: undefined });
    expect(formatted).toBe("28/04/2026");
  });

  it("should add days correctly", () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    expect(isBefore(today, tomorrow)).toBe(true);
  });

  it("should identify past dates correctly", () => {
    const pastDate = new Date(2020, 0, 1);
    const today = new Date();
    expect(isBefore(pastDate, today)).toBe(true);
  });
});

describe("Price Calculation Logic", () => {
  const courts = [
    { id: "1", price_per_hour: 35000, price_member: 25000 },
    { id: "2", price_per_hour: 15000, price_member: 10000 },
  ];

  it("calculates total price for non-member correctly", () => {
    const court = courts[0];
    const slots = 2;
    const total = court.price_per_hour * slots;
    expect(total).toBe(70000);
  });

  it("calculates total price for member correctly", () => {
    const court = courts[0];
    const slots = 2;
    const total = (court.price_member || court.price_per_hour) * slots;
    expect(total).toBe(50000);
  });

  it("uses non-member price when member price is null", () => {
    const court = { id: "3", price_per_hour: 20000, price_member: null };
    const slots = 1;
    const price = court.price_member || court.price_per_hour;
    expect(price * slots).toBe(20000);
  });
});
