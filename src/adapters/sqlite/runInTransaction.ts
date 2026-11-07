// Spec: AR-004, DS-002
import type { SqlDriver } from "./SqlDriver";

/** Shared BEGIN/COMMIT/ROLLBACK logic for SqlDriver implementations. */
export async function runInTransaction<T>(tx: SqlDriver, fn: (tx: SqlDriver) => Promise<T>): Promise<T> {
  await tx.execute("BEGIN");
  try {
    const result = await fn(tx);
    await tx.execute("COMMIT");
    return result;
  } catch (error) {
    await tx.execute("ROLLBACK");
    throw error;
  }
}
