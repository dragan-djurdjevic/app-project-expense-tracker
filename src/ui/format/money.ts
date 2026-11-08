// Spec: UI-002, DM-001, BR-GEN-001, BR-GEN-002, DM-060
import type { DomainError } from "../../core/domain/DomainError";
import type { Result } from "../../core/domain/Result";
import type { Language } from "../../core/domain/Settings";
import { formatLocale } from "./locale";

const MONEY_MAX = 999_999_999_999;

/**
 * Formats minor units with `Intl.NumberFormat(<locale>, { style: "currency" })` (UI-002), e.g. 123456 EUR →
 * "€1,234.56" (en) / "1.234,56\u00a0€" (sr-Latn).
 */
export function formatMoney(minorUnits: number, currency: string, language: Language = "en"): string {
  return new Intl.NumberFormat(formatLocale(language), { style: "currency", currency }).format(minorUnits / 100);
}

const invalid = (): Result<number> => ({
  ok: false,
  error: { code: "BR-GEN-001", messageKey: "errors.money.invalid" } satisfies DomainError,
});

/**
 * Parses a money input into minor units. The last `,` or `.` is the decimal separator and must be followed by
 * 1–2 digits; earlier separators must be the other character and group exactly 3 digits.
 */
export function parseMoney(input: string): Result<number> {
  const text = input.trim();
  if (text === "") {
    return { ok: false, error: { code: "BR-GEN-002", messageKey: "errors.required" } };
  }
  if (!/^[\d.,]+$/.test(text)) {
    return invalid();
  }
  const last = Math.max(text.lastIndexOf("."), text.lastIndexOf(","));
  let integerPart = text;
  let decimals = "";
  if (last >= 0) {
    const decimalSeparator = text[last];
    const groupSeparator = decimalSeparator === "." ? "," : ".";
    integerPart = text.slice(0, last);
    decimals = text.slice(last + 1);
    if (!/^\d{1,2}$/.test(decimals) || integerPart.includes(decimalSeparator)) {
      return invalid();
    }
    if (integerPart.includes(groupSeparator)) {
      const grouped = new RegExp(`^\\d{1,3}(\\${groupSeparator}\\d{3})+$`);
      if (!grouped.test(integerPart)) {
        return invalid();
      }
      integerPart = integerPart.split(groupSeparator).join("");
    }
  }
  if (!/^\d+$/.test(integerPart)) {
    return invalid();
  }
  const value = Number(integerPart) * 100 + Number(decimals.padEnd(2, "0"));
  if (!Number.isSafeInteger(value) || value > MONEY_MAX) {
    return invalid();
  }
  return { ok: true, value };
}
