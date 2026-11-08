// Spec: UI-002, AN-000
/**
 * Formats numerator ÷ denominator as a percentage with one decimal (round half up), e.g. (1, 3) → "33.3 %".
 * A zero denominator gives "—".
 */
export function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) {
    return "—";
  }
  const tenths = (numerator * 1000) / denominator;
  const rounded = Math.sign(tenths) * Math.round(Math.abs(tenths));
  return `${(rounded / 10).toFixed(1)} %`;
}

/** Formats a percentage computed by the core (AN-000d), e.g. 33.3 → "33.3 %"; null → "—". */
export function formatPercentValue(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)} %`;
}
