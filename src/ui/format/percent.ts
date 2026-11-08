// Spec: UI-002, AN-000, DM-060
import type { Language } from "../../core/domain/Settings";
import { localizeDecimal } from "./locale";

/**
 * Formats numerator ÷ denominator as a percentage with one decimal (round half up), e.g. (1, 3) → "33.3 %"
 * (en) / "33,3 %" (sr-Latn). A zero denominator gives "—".
 */
export function formatPercent(numerator: number, denominator: number, language: Language = "en"): string {
  if (denominator === 0) {
    return "—";
  }
  const tenths = (numerator * 1000) / denominator;
  const rounded = Math.sign(tenths) * Math.round(Math.abs(tenths));
  return `${localizeDecimal((rounded / 10).toFixed(1), language)} %`;
}

/** Formats a percentage computed by the core (AN-000d), e.g. 33.3 → "33.3 %" / "33,3 %"; null → "—". */
export function formatPercentValue(value: number | null, language: Language = "en"): string {
  return value === null ? "—" : `${localizeDecimal(value.toFixed(1), language)} %`;
}
