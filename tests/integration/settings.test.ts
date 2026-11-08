// Spec: DM-060, AR-004, AR-010, UI-080, DS-006
import { describe, expect, it } from "vitest";
import { SqliteSettingsRepository } from "../../src/adapters/sqlite/SqliteSettingsRepository";
import { makeGetSettings } from "../../src/core/usecases/settings/getSettings";
import { makeUpdateSettings } from "../../src/core/usecases/settings/updateSettings";
import { migratedDb } from "../fixtures/db";

async function setup() {
  const db = await migratedDb();
  const settingsRepo = new SqliteSettingsRepository(db);
  return {
    db,
    getSettings: makeGetSettings({ settingsRepo }),
    updateSettings: makeUpdateSettings({ settingsRepo }),
    // A second repository instance over the same DB proves the change is persisted, not cached.
    freshRepo: () => new SqliteSettingsRepository(db),
  };
}

describe("settings (DM-060)", () => {
  it('TC-M1-014 default row is EUR / 2000 / en; updateSettings({currency:"RSD", defaultVatRate:1000, language:"en"}) persists', async () => {
    const { getSettings, updateSettings, freshRepo } = await setup();

    expect(await getSettings()).toEqual({ ok: true, value: { currency: "EUR", defaultVatRate: 2000, language: "en" } });

    const result = await updateSettings({ currency: "RSD", defaultVatRate: 1000, language: "en" });
    const expected = { currency: "RSD", defaultVatRate: 1000, language: "en" };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await freshRepo().get()).toEqual(expected);
    expect(await getSettings()).toEqual({ ok: true, value: expected });
  });

  it("TC-M1-015 updateSettings with defaultVatRate 10001 returns a validation error and does not persist", async () => {
    const { db, updateSettings, freshRepo } = await setup();

    const result = await updateSettings({ currency: "RSD", defaultVatRate: 10001, language: "en" });

    expect(result).toEqual({
      ok: false,
      error: { code: "BR-GEN-003", messageKey: "errors.format", field: "defaultVatRate" },
    });
    expect(await freshRepo().get()).toEqual({ currency: "EUR", defaultVatRate: 2000, language: "en" });
    expect(await db.select("SELECT currency, default_vat_rate, language FROM settings")).toEqual([
      { currency: "EUR", default_vat_rate: 2000, language: "en" },
    ]);
  });

  it('TC-M6-007 updateSettings({ currency: "EUR", defaultVatRate: 2000, language: "sr-Latn" }) persists; getSettings returns sr-Latn', async () => {
    const { db, getSettings, updateSettings, freshRepo } = await setup();

    const result = await updateSettings({ currency: "EUR", defaultVatRate: 2000, language: "sr-Latn" });

    const expected = { currency: "EUR", defaultVatRate: 2000, language: "sr-Latn" };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await freshRepo().get()).toEqual(expected);
    expect(await getSettings()).toEqual({ ok: true, value: expected });
    expect(await db.select("SELECT language FROM settings WHERE id = 1")).toEqual([{ language: "sr-Latn" }]);
  });
});
