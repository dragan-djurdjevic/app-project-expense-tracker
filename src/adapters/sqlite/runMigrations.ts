// Spec: DS-002, DS-006, AR-010
import type { Clock } from "../../core/ports/Clock";
import type { SqlDriver } from "./SqlDriver";

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Applies pending migrations in numeric order, each in its own transaction; returns applied versions. */
export async function runMigrations(driver: SqlDriver, migrations: Migration[], clock: Clock): Promise<number[]> {
  const tables = await driver.select<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
  );
  const done = new Set<number>();
  if (tables.length > 0) {
    const rows = await driver.select<{ version: number }>("SELECT version FROM schema_migrations");
    rows.forEach((row) => done.add(row.version));
  }
  const applied: number[] = [];
  for (const migration of [...migrations].sort((a, b) => a.version - b.version)) {
    if (done.has(migration.version)) {
      continue;
    }
    await driver.transaction(async (tx) => {
      await tx.execute(migration.sql);
      await tx.execute("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)", [
        migration.version,
        clock.now().toISOString(),
      ]);
    });
    applied.push(migration.version);
  }
  return applied;
}

/** AR-010 step 3: make sure the single settings row exists (defaults EUR / 2000 / en come from the schema). */
export async function ensureSettingsRow(driver: SqlDriver): Promise<void> {
  await driver.execute("INSERT OR IGNORE INTO settings (id) VALUES (1)");
}
