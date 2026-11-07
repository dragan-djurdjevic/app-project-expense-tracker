// Spec: DM-001, BR-GEN-002, BR-GEN-003
import { formatError, requiredError } from "./DomainError";
import { err, ok, type Result } from "./Result";

/** Required text: trimmed, non-empty (BR-GEN-002), at most `max` characters (BR-GEN-003). */
export function requiredText(value: string | null | undefined, max: number, field: string): Result<string> {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") {
    return err(requiredError(field));
  }
  if (trimmed.length > max) {
    return err(formatError(field));
  }
  return ok(trimmed);
}

/** Optional text: trimmed, empty after trim → null (DM-001), at most `max` characters (BR-GEN-003). */
export function optionalText(value: string | null | undefined, max: number, field: string): Result<string | null> {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") {
    return ok(null);
  }
  if (trimmed.length > max) {
    return err(formatError(field));
  }
  return ok(trimmed);
}
