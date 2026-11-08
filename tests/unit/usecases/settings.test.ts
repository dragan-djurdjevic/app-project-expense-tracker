// Spec: DM-060, AR-005, BR-GEN-003, UI-080
import { describe, expect, it } from "vitest";
import { makeUpdateSettings } from "../../../src/core/usecases/settings/updateSettings";
import { InMemorySettingsRepository } from "./InMemoryInvoiceRepositories";

describe("updateSettings (DM-060)", () => {
  it('TC-M6-005 updateSettings with language "de" returns BR-GEN-003 for field language and persists nothing', async () => {
    const settingsRepo = new InMemorySettingsRepository({ currency: "EUR", defaultVatRate: 2000, language: "en" });
    const updateSettings = makeUpdateSettings({ settingsRepo });

    const result = await updateSettings({ currency: "RSD", defaultVatRate: 1000, language: "de" });

    expect(result).toEqual({
      ok: false,
      error: { code: "BR-GEN-003", messageKey: "errors.format", field: "language" },
    });
    expect(await settingsRepo.get()).toEqual({ currency: "EUR", defaultVatRate: 2000, language: "en" });
  });
});
