// Spec: AR-004, AR-009, DS-001
import initSqlJs, { type Database, type SqlValue as SqlJsValue } from "sql.js";
import { runInTransaction } from "./runInTransaction";
import { SerialQueue } from "./SerialQueue";
import type { ExecuteResult, SqlDriver, SqlValue } from "./SqlDriver";

export interface SqlJsDriverOptions {
  /** Resolves the URL of `sql-wasm.wasm` (needed in the browser; Node finds it automatically). */
  locateFile?: (file: string) => string;
}

/** In-memory SQLite via sql.js — used by tests and browser mode. */
export class SqlJsDriver implements SqlDriver {
  private readonly queue = new SerialQueue();
  private readonly direct: SqlDriver;

  private constructor(private readonly db: Database) {
    this.direct = {
      execute: async (sql, params) => this.run(sql, params),
      select: async <T>(sql: string, params?: SqlValue[]) => this.query<T>(sql, params),
      transaction: () => Promise.reject(new Error("Nested transactions are not supported")),
    };
  }

  static async create(options: SqlJsDriverOptions = {}): Promise<SqlJsDriver> {
    const SQL = await initSqlJs(options.locateFile ? { locateFile: options.locateFile } : undefined);
    const driver = new SqlJsDriver(new SQL.Database());
    await driver.execute("PRAGMA foreign_keys = ON");
    return driver;
  }

  execute(sql: string, params: SqlValue[] = []): Promise<ExecuteResult> {
    return this.queue.run(async () => this.run(sql, params));
  }

  select<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.queue.run(async () => this.query<T>(sql, params));
  }

  transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T> {
    return this.queue.run(() => runInTransaction(this.direct, fn));
  }

  private run(sql: string, params: SqlValue[] = []): ExecuteResult {
    // Without parameters sql.js executes every statement of a multi-statement script (migrations).
    this.db.run(sql, params.length > 0 ? (params as SqlJsValue[]) : undefined);
    return { rowsAffected: this.db.getRowsModified() };
  }

  private query<T>(sql: string, params: SqlValue[] = []): T[] {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params as SqlJsValue[]);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }
}
