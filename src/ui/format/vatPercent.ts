// Spec: UI-002, DM-001, BR-GEN-002, BR-GEN-003
import type { Result } from "../../core/domain/Result";

/** Parses a VAT percent with up to 2 decimals into basis points, e.g. "20" → 2000, "9.5" → 950. */
export function parseVatPercent(input: string): Result<number> {
  const text = input.trim();
  if (text === "") {
    return { ok: false, error: { code: "BR-GEN-002", messageKey: "errors.required" } };
  }
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) {
    return { ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } };
  }
  const value = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (value > 10_000) {
    return { ok: false, error: { code: "BR-GEN-003", messageKey: "errors.format" } };
  }
  return { ok: true, value };
}

/** Formats basis points as a percent input value, e.g. 2000 → "20", 950 → "9.5". */
export function formatVatPercent(basisPoints: number): string {
  return String(basisPoints / 100);
}
