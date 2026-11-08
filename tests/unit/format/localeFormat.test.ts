// Spec: UI-002, UI-050, DM-060
import { describe, expect, it } from "vitest";
import { compareText } from "../../../src/ui/format/locale";
import { formatMoney } from "../../../src/ui/format/money";
import { formatPercent, formatPercentValue } from "../../../src/ui/format/percent";
import { formatVatPercent, formatVatRate, parseVatPercent } from "../../../src/ui/format/vatPercent";

describe("locale-aware formatting (UI-002)", () => {
  it('TC-M6-002 formatMoney(123456, "EUR", "sr-Latn") is 1.234,56\\u00a0€; with "en" it is €1,234.56', () => {
    expect(formatMoney(123456, "EUR", "sr-Latn")).toBe("1.234,56\u00a0€");
    expect(formatMoney(123456, "EUR", "en")).toBe("€1,234.56");
  });

  it("TC-M6-003 sr-Latn percent and VAT formatting uses the decimal comma", () => {
    expect(formatPercent(1, 3, "sr-Latn")).toBe("33,3 %");
    expect(formatPercentValue(212.5, "sr-Latn")).toBe("212,5 %");
    expect(formatVatRate(950, "sr-Latn")).toBe("9,5 %");
    expect(formatVatPercent(950, "sr-Latn")).toBe("9,5");
    expect(formatPercent(1, 0, "sr-Latn")).toBe("—");
  });

  it('TC-M6-004 parseVatPercent accepts "9,5" and "9.5" as 950 and rejects "20,125" and "9,5,0"', () => {
    expect(parseVatPercent("9,5")).toEqual({ ok: true, value: 950 });
    expect(parseVatPercent("9.5")).toEqual({ ok: true, value: 950 });
    expect(parseVatPercent("20,125")).toEqual({
      ok: false,
      error: { code: "BR-GEN-003", messageKey: "errors.format" },
    });
    expect(parseVatPercent("9,5,0")).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
  });

  it("TC-M6-012 sr-Latn sorting orders Cvijić, Čačak, Ćuprija, Dragan, Đakovica", () => {
    const names = ["Đakovica", "Ćuprija", "Dragan", "Čačak", "Cvijić"];

    expect([...names].sort((a, b) => compareText(a, b, "sr-Latn"))).toEqual([
      "Cvijić",
      "Čačak",
      "Ćuprija",
      "Dragan",
      "Đakovica",
    ]);
  });
});
