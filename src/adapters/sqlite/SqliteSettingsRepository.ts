// Spec: AR-004, DM-060, AR-008
import type { Settings } from "../../core/domain/Settings";
import type { SettingsRepository } from "../../core/ports/SettingsRepository";
import type { SqlDriver } from "./SqlDriver";

interface SettingsRow {
  currency: string;
  default_vat_rate: number;
}

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: SqlDriver) {}

  async get(): Promise<Settings> {
    const rows = await this.db.select<SettingsRow>("SELECT currency, default_vat_rate FROM settings WHERE id = 1");
    const row = rows[0];
    if (!row) {
      throw new Error("Settings row is missing");
    }
    return { currency: row.currency as Settings["currency"], defaultVatRate: row.default_vat_rate };
  }

  async update(settings: Settings): Promise<void> {
    await this.db.execute("UPDATE settings SET currency = ?, default_vat_rate = ? WHERE id = 1", [
      settings.currency,
      settings.defaultVatRate,
    ]);
  }
}
