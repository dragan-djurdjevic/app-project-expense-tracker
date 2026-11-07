// Spec: AR-005, DM-060, UI-080
import type { Result } from "../../domain/Result";
import { ok } from "../../domain/Result";
import type { Settings } from "../../domain/Settings";
import type { SettingsRepository } from "../../ports/SettingsRepository";

export type GetSettings = () => Promise<Result<Settings>>;

export function makeGetSettings({ settingsRepo }: { settingsRepo: SettingsRepository }): GetSettings {
  return async () => ok(await settingsRepo.get());
}
