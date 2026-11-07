// Spec: UI-002a, AR-008
import type { SqlValue } from "./SqlDriver";

/** `LIKE` pattern for a case-insensitive "contains" search; `%`, `_` and `\` in the term match literally. */
export function containsPattern(term: string): string {
  return `%${term.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * SQL condition "any of `columns` contains `term`" (case-insensitive) plus its parameters; null for an empty term.
 */
export function searchCondition(
  columns: string[],
  term: string | undefined,
): { sql: string; params: SqlValue[] } | null {
  const trimmed = (term ?? "").trim();
  if (trimmed === "") return null;
  const pattern = containsPattern(trimmed);
  return {
    sql: `(${columns.map((column) => `LOWER(${column}) LIKE ? ESCAPE '\\'`).join(" OR ")})`,
    params: columns.map(() => pattern),
  };
}
