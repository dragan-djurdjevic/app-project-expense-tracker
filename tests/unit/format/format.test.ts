// Spec: UI-002
import { describe, expect, it } from "vitest";
import { formatDate } from "../../../src/ui/format/date";
import { formatMoney, parseMoney } from "../../../src/ui/format/money";
import { formatPercent } from "../../../src/ui/format/percent";
import { parseVatPercent } from "../../../src/ui/format/vatPercent";

describe("formatting helpers (UI-002)", () => {
  it("TC-M1-006 parseMoney accepts 1234.56, 1,234.56, 1234,56, 12, 1.234,56 and rejects 1.234, 1,234, abc", () => {
    expect(parseMoney("1234.56")).toEqual({ ok: true, value: 123456 });
    expect(parseMoney("1,234.56")).toEqual({ ok: true, value: 123456 });
    expect(parseMoney("1234,56")).toEqual({ ok: true, value: 123456 });
    expect(parseMoney("12")).toEqual({ ok: true, value: 1200 });
    expect(parseMoney("1.234,56")).toEqual({ ok: true, value: 123456 });
    for (const bad of ["1.234", "1,234", "abc"]) {
      expect(parseMoney(bad), bad).toEqual({
        ok: false,
        error: { code: "BR-GEN-001", messageKey: "errors.money.invalid" },
      });
    }
  });

  it('TC-M1-007 formatMoney(123456, "EUR") is €1,234.56; formatPercent(1,3) is 33.3 %; formatPercent(1,0) is —', () => {
    expect(formatMoney(123456, "EUR")).toBe("€1,234.56");
    expect(formatPercent(1, 3)).toBe("33.3 %");
    expect(formatPercent(1, 0)).toBe("—");
  });

  it('TC-M1-008 formatDate("2026-03-05") is 05.03.2026', () => {
    expect(formatDate("2026-03-05")).toBe("05.03.2026");
  });

  it('TC-M1-009 parseVatPercent("20") is 2000, "9.5" is 950, "20.125" is an error', () => {
    expect(parseVatPercent("20")).toEqual({ ok: true, value: 2000 });
    expect(parseVatPercent("9.5")).toEqual({ ok: true, value: 950 });
    expect(parseVatPercent("20.125").ok).toBe(false);
  });
});
