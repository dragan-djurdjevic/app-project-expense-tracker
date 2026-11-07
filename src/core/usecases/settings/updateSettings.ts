// Spec: AR-005, DM-060, DM-001, BR-GEN-003, UI-080
import { formatError } from "../../domain/DomainError";
import { err, ok, type Result } from "../../domain/Result";
import { CURRENCIES, isCurrency, type Currency, type Settings } from "../../domain/Settings";
import { createVatRate } from "../../domain/VatRate";
import type { SettingsRepository } from "../../ports/SettingsRepository";

/** Currencies offered on the Settings screen (DM-060). */
export const SUPPORTED_CURRENCIES: readonly Currency[] = CURRENCIES;

export interface UpdateSettingsInput {
  currency: string;
  defaultVatRate: number;
}

export type UpdateSettings = (input: UpdateSettingsInput) => Promise<Result<Settings>>;

export function makeUpdateSettings({ settingsRepo }: { settingsRepo: SettingsRepository }): UpdateSettings {
  return async (input) => {
    const currency = input.currency.trim();
    if (!isCurrency(currency)) {
      return err(formatError("currency"));
    }
    const vatRate = createVatRate(input.defaultVatRate, "defaultVatRate");
    if (!vatRate.ok) {
      return vatRate;
    }
    const settings: Settings = { currency, defaultVatRate: vatRate.value };
    await settingsRepo.update(settings);
    return ok(settings);
  };
}
