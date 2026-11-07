// Spec: DM-001, BR-GEN-002, BR-GEN-003
import { formatError, requiredError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** Trimmed, upper-case VAT number: 3–20 chars of letters, digits and `-`. */
export type VatNumber = string;

const VAT_NUMBER = /^[A-Za-z0-9-]{3,20}$/;

export function createVatNumber(value: string, field?: string): Result<VatNumber> {
  const trimmed = value.trim();
  if (trimmed === "") {
    return err(requiredError(field));
  }
  if (!VAT_NUMBER.test(trimmed)) {
    return err(formatError(field));
  }
  return ok(trimmed.toUpperCase());
}
