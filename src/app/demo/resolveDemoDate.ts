// Spec: DEMO-002
import type { DateOnly } from "../../core/domain/DateOnly";

/** DEMO-002: `Y0-MM-DD`, `Y-<n>-MM-DD` or `Y+<n>-MM-DD`. */
const RELATIVE_DATE = /^Y(0|[+-][1-9]\d*)-(\d{2})-(\d{2})$/;

/** DEMO-002: invoice due date = date + 30 calendar days. */
export const DEMO_DUE_DAYS = 30;

/**
 * DEMO-002: resolves a relative dataset date against `today` (local `YYYY-MM-DD`); a date with offset 0 later than
 * today is clamped to today, other offsets are never clamped.
 */
export function resolveDemoDate(relative: string, today: DateOnly): DateOnly {
  const match = RELATIVE_DATE.exec(relative);
  if (!match) throw new Error(`Invalid demo date: ${relative}`);
  const offset = Number(match[1]);
  const year = Number(today.slice(0, 4)) + offset;
  const resolved = `${String(year).padStart(4, "0")}-${match[2]}-${match[3]}`;
  return offset === 0 && resolved > today ? today : resolved;
}

/** DEMO-002: `date` + `days` calendar days. */
export function addDays(date: DateOnly, days: number): DateOnly {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** DEMO-002: the invoice due date for a resolved invoice date. */
export function demoDueDate(date: DateOnly): DateOnly {
  return addDays(date, DEMO_DUE_DAYS);
}
