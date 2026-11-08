// Spec: DS-001, DS-002, DS-003, DS-006, AR-004, AR-010
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bundledMigrations } from "../../src/adapters/sqlite/bundledMigrations";
import { ensureSettingsRow, runMigrations } from "../../src/adapters/sqlite/runMigrations";
import { SqlJsDriver } from "../../src/adapters/sqlite/SqlJsDriver";
import { migratedDb } from "../fixtures/db";
import { fixedClock } from "../fixtures/fixedClock";

const DS003_TABLES = ["contract", "investor", "invoice", "project", "schema_migrations", "settings", "subcontractor"];
const DS003_INDEXES = [
  "ix_contract_date",
  "ix_contract_project",
  "ix_contract_subcontractor",
  "ix_invoice_contract",
  "ix_invoice_date",
  "ix_project_investor",
  "ux_contract_project_number",
  "ux_invoice_contract_number",
];

async function names(db: SqlJsDriver, type: "table" | "index"): Promise<string[]> {
  const rows = await db.select<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name",
    [type],
  );
  return rows.map((row) => row.name);
}

describe("migrations (DS-002, DS-003)", () => {
  it("TC-M1-010 migration runner on an empty SqlJs DB creates all DS-003 tables and records every migration version (1, 2)", async () => {
    const db = await SqlJsDriver.create();
    const applied = await runMigrations(db, bundledMigrations(), fixedClock("2026-11-07T10:00:00.000Z"));

    expect(applied).toEqual([1, 2]);
    expect(await names(db, "table")).toEqual(DS003_TABLES);
    expect(await names(db, "index")).toEqual(DS003_INDEXES);
    expect(await db.select("SELECT version, applied_at FROM schema_migrations ORDER BY version")).toEqual([
      { version: 1, applied_at: "2026-11-07T10:00:00.000Z" },
      { version: 2, applied_at: "2026-11-07T10:00:00.000Z" },
    ]);
  });

  it("TC-M1-010 0001_init.sql is exactly the normative DS-003 SQL", () => {
    const spec = readFileSync(new URL("../../spec/03-data-schema.md", import.meta.url), "utf8");
    const section = spec.slice(spec.indexOf("## DS-003"));
    const normative = /```sql\n([\s\S]*?)```/.exec(section)?.[1];
    const migration = bundledMigrations().find((m) => m.version === 1)?.sql ?? "";
    const withoutHeader = migration.replace(/^-- Spec:.*\n/, "");

    expect(normative).toBeDefined();
    expect(withoutHeader).toBe(normative);
  });

  it("TC-M1-011 running migrations twice is idempotent", async () => {
    const db = await SqlJsDriver.create();
    await runMigrations(db, bundledMigrations(), fixedClock());

    await expect(runMigrations(db, bundledMigrations(), fixedClock())).resolves.toEqual([]);
    await expect(ensureSettingsRow(db)).resolves.toBeUndefined();
    expect(await db.select("SELECT version FROM schema_migrations ORDER BY version")).toEqual([
      { version: 1 },
      { version: 2 },
    ]);
    expect(await db.select("SELECT COUNT(*) AS n FROM settings")).toEqual([{ n: 1 }]);
  });

  it("TC-M1-012 PRAGMA foreign_keys is ON after the driver opens", async () => {
    const db = await SqlJsDriver.create();
    expect(await db.select("PRAGMA foreign_keys")).toEqual([{ foreign_keys: 1 }]);
  });

  it("TC-M1-013 DB CHECK rejects INCOMING with subcontractor_id and OUTGOING without", async () => {
    const db = await migratedDb();
    const ts = "2026-01-01T00:00:00.000Z";
    await db.execute(
      "INSERT INTO investor (id, name, vat_number, created_at, updated_at) VALUES ('i1', 'Alpha', 'ALPHA001', ?, ?)",
      [ts, ts],
    );
    await db.execute(
      "INSERT INTO subcontractor (id, name, vat_number, created_at, updated_at) VALUES ('s1', 'Struct', 'STRUCT01', ?, ?)",
      [ts, ts],
    );
    await db.execute(
      "INSERT INTO project (id, name, investor_id, created_at, updated_at) VALUES ('p1', 'Villa', 'i1', ?, ?)",
      [ts, ts],
    );
    const insertContract = (id: string, type: string, subcontractorId: string | null) =>
      db.execute(
        `INSERT INTO contract (id, number, type, project_id, subcontractor_id, value, date, created_at, updated_at)
         VALUES (?, ?, ?, 'p1', ?, 100, '2026-01-01', ?, ?)`,
        [id, id, type, subcontractorId, ts, ts],
      );

    await expect(insertContract("c1", "INCOMING", "s1")).rejects.toThrow(/CHECK constraint failed/);
    await expect(insertContract("c2", "OUTGOING", null)).rejects.toThrow(/CHECK constraint failed/);
    // Valid combinations are accepted, so the failures above come from the type/subcontractor CHECK.
    await expect(insertContract("c3", "INCOMING", null)).resolves.toEqual({ rowsAffected: 1 });
    await expect(insertContract("c4", "OUTGOING", "s1")).resolves.toEqual({ rowsAffected: 1 });
    expect(await db.select("SELECT id FROM contract ORDER BY id")).toEqual([{ id: "c3" }, { id: "c4" }]);
  });

  it("TC-M6-006 0002_settings_language.sql is exactly the normative DS-006 SQL", () => {
    const spec = readFileSync(new URL("../../spec/03-data-schema.md", import.meta.url), "utf8");
    const section = spec.slice(spec.indexOf("## DS-006"));
    const normative = /```sql\n([\s\S]*?)```/.exec(section)?.[1];
    const migration = bundledMigrations().find((m) => m.version === 2);

    expect(normative).toBeDefined();
    expect(migration?.name).toBe("settings_language");
    expect(migration?.sql.replace(/^-- Spec:.*\n/, "")).toBe(normative);
  });

  it("TC-M6-006 migrations on a DB with only 0001 applied add settings.language = en; second run is a no-op; CHECK rejects de", async () => {
    const db = await SqlJsDriver.create();
    const all = bundledMigrations();
    expect(
      await runMigrations(
        db,
        all.filter((m) => m.version === 1),
        fixedClock(),
      ),
    ).toEqual([1]);
    await ensureSettingsRow(db);
    await db.execute("UPDATE settings SET currency = 'RSD', default_vat_rate = 1000 WHERE id = 1");

    expect(await runMigrations(db, all, fixedClock())).toEqual([2]);
    expect(await db.select("SELECT currency, default_vat_rate, language FROM settings")).toEqual([
      { currency: "RSD", default_vat_rate: 1000, language: "en" },
    ]);
    expect(await db.select("SELECT version FROM schema_migrations ORDER BY version")).toEqual([
      { version: 1 },
      { version: 2 },
    ]);

    expect(await runMigrations(db, all, fixedClock())).toEqual([]);
    expect(await db.select("SELECT version FROM schema_migrations ORDER BY version")).toEqual([
      { version: 1 },
      { version: 2 },
    ]);

    await expect(db.execute("UPDATE settings SET language = 'de' WHERE id = 1")).rejects.toThrow(
      /CHECK constraint failed/,
    );
    await expect(db.execute("UPDATE settings SET language = 'sr-Latn' WHERE id = 1")).resolves.toEqual({
      rowsAffected: 1,
    });
  });
});
