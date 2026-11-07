// Spec: AR-004, AR-009, DS-001
import Database from "@tauri-apps/plugin-sql";
import { runInTransaction } from "../sqlite/runInTransaction";
import { SerialQueue } from "../sqlite/SerialQueue";
import type { ExecuteResult, SqlDriver, SqlValue } from "../sqlite/SqlDriver";

/**
 * SQLite via `@tauri-apps/plugin-sql` (production). All calls are serialised so that a transaction's
 * BEGIN … COMMIT run back-to-back on the same pooled connection.
 */
export class TauriSqlDriver implements SqlDriver {
  private readonly queue = new SerialQueue();
  private readonly direct: SqlDriver;

  private constructor(private readonly db: Database) {
    this.direct = {
      execute: async (sql, params) => this.run(sql, params),
      select: async <T>(sql: string, params?: SqlValue[]) => this.db.select<T[]>(sql, params ?? []),
      transaction: () => Promise.reject(new Error("Nested transactions are not supported")),
    };
  }

  /** Opens (and creates if missing) the SQLite file at the absolute path `dbPath`. */
  static async open(dbPath: string): Promise<TauriSqlDriver> {
    const driver = new TauriSqlDriver(await Database.load(`sqlite:${dbPath}`));
    await driver.execute("PRAGMA foreign_keys = ON");
    return driver;
  }

  execute(sql: string, params: SqlValue[] = []): Promise<ExecuteResult> {
    return this.queue.run(() => this.run(sql, params));
  }

  select<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.queue.run(() => this.db.select<T[]>(sql, params));
  }

  transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T> {
    return this.queue.run(() => runInTransaction(this.direct, fn));
  }

  private async run(sql: string, params: SqlValue[] = []): Promise<ExecuteResult> {
    const result = await this.db.execute(sql, params);
    return { rowsAffected: result.rowsAffected };
  }
}
