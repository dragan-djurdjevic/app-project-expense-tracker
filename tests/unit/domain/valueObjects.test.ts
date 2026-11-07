// Spec: DM-001, BR-GEN-001, BR-GEN-002, BR-GEN-003
import { describe, expect, it } from "vitest";
import { createDateOnly } from "../../../src/core/domain/DateOnly";
import { createEmail } from "../../../src/core/domain/Email";
import { createMoney } from "../../../src/core/domain/Money";
import { createVatNumber } from "../../../src/core/domain/VatNumber";
import { createVatRate } from "../../../src/core/domain/VatRate";

describe("value objects (DM-001)", () => {
  it("TC-M1-001 Money accepts 0 and 999 999 999 999; rejects -1, 1.5, 10^12 with BR-GEN-001", () => {
    expect(createMoney(0)).toEqual({ ok: true, value: 0 });
    expect(createMoney(999_999_999_999)).toEqual({ ok: true, value: 999_999_999_999 });
    for (const bad of [-1, 1.5, 10 ** 12]) {
      expect(createMoney(bad, "value")).toEqual({
        ok: false,
        error: { code: "BR-GEN-001", messageKey: "errors.money.invalid", field: "value" },
      });
    }
  });

  it("TC-M1-002 VatRate accepts 0, 2000, 10000; rejects -1, 10001, 12.5", () => {
    for (const good of [0, 2000, 10000]) {
      expect(createVatRate(good)).toEqual({ ok: true, value: good });
    }
    for (const bad of [-1, 10001, 12.5]) {
      expect(createVatRate(bad)).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
    }
  });

  it("TC-M1-003 DateOnly accepts 2026-02-28; rejects 2026-02-30, 26-1-1 and empty", () => {
    expect(createDateOnly("2026-02-28")).toEqual({ ok: true, value: "2026-02-28" });
    expect(createDateOnly("2026-02-30")).toEqual({
      ok: false,
      error: { code: "BR-GEN-003", messageKey: "errors.format" },
    });
    expect(createDateOnly("26-1-1")).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
    expect(createDateOnly("")).toEqual({ ok: false, error: { code: "BR-GEN-002", messageKey: "errors.required" } });
  });

  it('TC-M1-004 VatNumber trims and upper-cases " ab-12c " to AB-12C; rejects "a" and "ab$12"', () => {
    expect(createVatNumber(" ab-12c ")).toEqual({ ok: true, value: "AB-12C" });
    expect(createVatNumber("a")).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
    expect(createVatNumber("ab$12")).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
  });

  it('TC-M1-005 Email accepts "a@b.co" and null; rejects "a@b"', () => {
    expect(createEmail("a@b.co")).toEqual({ ok: true, value: "a@b.co" });
    expect(createEmail(null)).toEqual({ ok: true, value: null });
    expect(createEmail("a@b")).toEqual({ ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } });
  });
});
