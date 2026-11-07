// Spec: AR-004, DS-001
export type SqlValue = string | number | null;

export interface ExecuteResult {
  rowsAffected: number;
}

/** Adapter-internal SQL abstraction; positional `?` parameters. */
export interface SqlDriver {
  execute(sql: string, params?: SqlValue[]): Promise<ExecuteResult>;
  select<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** Runs `fn` inside BEGIN … COMMIT (ROLLBACK on error). Other calls wait until it finishes. */
  transaction<T>(fn: (tx: SqlDriver) => Promise<T>): Promise<T>;
}
