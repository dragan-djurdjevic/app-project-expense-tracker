// Spec: AR-004, DM-060
import type { Settings } from "../domain/Settings";

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(settings: Settings): Promise<void>;
}
