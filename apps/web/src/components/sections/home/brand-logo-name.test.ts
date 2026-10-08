import { describe, it, expect } from "vitest";
import { brandLogoName } from "./brand-logo-name";

describe("brandLogoName", () => {
  it.each([
    ["03-iifl-finance.webp", "IIFL Finance"],
    ["04-5paisa.webp", "5paisa"],
    ["05-kpmg.png", "KPMG"],
    ["07-o9.webp", "o9 Solutions"],
    ["10-vi.webp", "Vi"],
    ["13-63moons.webp", "63 moons"],
    ["logo-iftas.svg", "IFTAS"],
    ["mahindra-red-logo.webp", "Mahindra"],
  ])("maps %s to %s", (file, name) => {
    expect(brandLogoName(file)).toBe(name);
  });

  it("title-cases unknown files after dropping the order prefix", () => {
    expect(brandLogoName("11-godrej-capital.webp")).toBe("Godrej Capital");
    expect(brandLogoName("16-federal-bank.svg")).toBe("Federal Bank");
    expect(brandLogoName("avendus.svg")).toBe("Avendus");
  });
});
