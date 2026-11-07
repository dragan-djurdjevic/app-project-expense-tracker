// Spec: DM-001, BR-GEN-002, BR-GEN-003
import { formatError, requiredError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** ISO calendar date `YYYY-MM-DD`. */
export type DateOnly = string;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function createDateOnly(value: string, field?: string): Result<DateOnly> {
  const trimmed = value.trim();
  if (trimmed === "") {
    return err(requiredError(field));
  }
  const match = DATE_ONLY.exec(trimmed);
  if (!match) {
    return err(formatError(field));
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return err(formatError(field));
  }
  return ok(trimmed);
}
