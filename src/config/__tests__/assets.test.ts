import { prices } from "@/config/assets";

describe("Prices Configuration", () => {
  it("should have 4 courts defined", () => {
    expect(prices).toHaveLength(4);
  });

  it("each court should have required properties", () => {
    prices.forEach((court) => {
      expect(court).toHaveProperty("court");
      expect(court).toHaveProperty("priceNonMember");
      expect(court).toHaveProperty("priceMember");
      expect(court).toHaveProperty("image");
      expect(court).toHaveProperty("description");
    });
  });

  it("member price should be lower than non-member price for all courts", () => {
    prices.forEach((court) => {
      expect(court.priceMember).toBeLessThan(court.priceNonMember);
    });
  });

  it("should have positive prices", () => {
    prices.forEach((court) => {
      expect(court.priceMember).toBeGreaterThan(0);
      expect(court.priceNonMember).toBeGreaterThan(0);
    });
  });

  it("should have unique court names", () => {
    const names = prices.map((p) => p.court);
    const uniqueNames = [...new Set(names)];
    expect(uniqueNames).toHaveLength(names.length);
  });
});
