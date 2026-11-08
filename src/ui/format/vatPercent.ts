// Spec: UI-002, UI-050, DM-001, BR-GEN-002, BR-GEN-003, DM-060
import type { Result } from "../../core/domain/Result";
import type { Language } from "../../core/domain/Settings";
import { localizeDecimal } from "./locale";

/**
 * Parses a VAT percent with up to 2 decimals into basis points; decimal separator `.` or `,` (UI-002),
 * e.g. "20" → 2000, "9.5" / "9,5" → 950.
 */
export function parseVatPercent(input: string): Result<number> {
  const text = input.trim();
  if (text === "") {
    return { ok: false, error: { code: "BR-GEN-002", messageKey: "errors.required" } };
  }
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text);
  if (!match) {
    return { ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } };
  }
  const value = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (value > 10_000) {
    return { ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } };
  }
  return { ok: true, value };
}

/** Formats basis points as a percent input value, e.g. 2000 → "20", 950 → "9.5" (en) / "9,5" (sr-Latn). */
export function formatVatPercent(basisPoints: number, language: Language = "en"): string {
  return localizeDecimal(String(basisPoints / 100), language);
}

/**
 * UI-050 VAT % column: basis points ÷ 100, up to 2 decimals without trailing zeros, e.g. 2000 → "20 %",
 * 950 → "9.5 %" (en) / "9,5 %" (sr-Latn).
 */
export function formatVatRate(basisPoints: number, language: Language = "en"): string {
  return `${formatVatPercent(basisPoints, language)} %`;
}
