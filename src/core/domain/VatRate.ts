// Spec: DM-001, BR-GEN-003
import { formatError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** VAT rate in integer basis points (2000 = 20.00 %). */
export type VatRate = number;

export const VAT_RATE_MIN = 0;
export const VAT_RATE_MAX = 10_000;

export function createVatRate(value: number, field?: string): Result<VatRate> {
  if (!Number.isInteger(value) || value < VAT_RATE_MIN || value > VAT_RATE_MAX) {
    return err(formatError(field));
  }
  return ok(value);
}
