// Spec: AN-000
/** A percentage with one decimal (45.5 = 45.5 %), or null when the denominator is 0 (shown as "—"). */
export type Percent = number | null;

/** AN-000d: `round_half_up(numerator / denominator × 100, 1 decimal)`; denominator 0 → null. */
export function percent(numerator: number, denominator: number): Percent {
  if (denominator === 0) return null;
  const negative = numerator < 0 !== denominator < 0;
  const scaled = Math.abs(numerator) * 1000;
  const divisor = Math.abs(denominator);
  let tenths = Math.floor(scaled / divisor);
  if ((scaled - tenths * divisor) * 2 >= divisor) tenths += 1;
  if (tenths === 0) return 0;
  return (negative ? -tenths : tenths) / 10;
}

/** AN-000e: footer total = sum of the row values. */
export function sumOf<T>(rows: readonly T[], pick: (row: T) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}
