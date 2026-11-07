// Spec: DM-001, BR-GEN-001
import { moneyError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** Integer amount in minor units (e.g. cents). */
export type Money = number;

export const MONEY_MIN = 0;
export const MONEY_MAX = 999_999_999_999;

export function createMoney(value: number, field?: string): Result<Money> {
  if (!Number.isSafeInteger(value) || value < MONEY_MIN || value > MONEY_MAX) {
    return err(moneyError(field));
  }
  return ok(value);
}
