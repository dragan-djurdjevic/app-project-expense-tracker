// Spec: DM-001, BR-GEN-003
import { formatError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** Optional e-mail address; null when absent. */
export type Email = string;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createEmail(value: string | null | undefined, field?: string): Result<Email | null> {
  if (value === null || value === undefined) {
    return ok(null);
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return ok(null);
  }
  if (!EMAIL.test(trimmed)) {
    return err(formatError(field));
  }
  return ok(trimmed);
}
