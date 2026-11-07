// Spec: AR-004, DS-002
import { bundledMigrations } from "../../src/adapters/sqlite/bundledMigrations";
import { ensureSettingsRow, runMigrations } from "../../src/adapters/sqlite/runMigrations";
import { SqlJsDriver } from "../../src/adapters/sqlite/SqlJsDriver";
import { fixedClock } from "./fixedClock";

/** Fresh in-memory DB with all migrations applied (AR-010 steps 1–3). */
export async function migratedDb(): Promise<SqlJsDriver> {
  const db = await SqlJsDriver.create();
  await runMigrations(db, bundledMigrations(), fixedClock());
  await ensureSettingsRow(db);
  return db;
}
