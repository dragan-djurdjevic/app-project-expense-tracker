// Spec: AR-001, AR-009, UI-080
import type { GetSettings } from "../core/usecases/settings/getSettings";
import type { UpdateSettings } from "../core/usecases/settings/updateSettings";

export interface UseCases {
  getSettings: GetSettings;
  updateSettings: UpdateSettings;
}

export type RuntimeMode = "tauri" | "browser";

export interface RuntimeInfo {
  mode: RuntimeMode;
  /** Absolute DB file path (Tauri mode) or null (in-memory browser mode). */
  dbPath: string | null;
  /** Absolute documents folder (Tauri mode) or null (browser mode). */
  documentsPath: string | null;
  /** Opens a folder in the OS file manager; null when not available (browser mode). */
  openFolder: ((path: string) => Promise<void>) | null;
}

export interface Container {
  useCases: UseCases;
  runtime: RuntimeInfo;
}

/** Raised when the startup sequence (AR-010 steps 1–3) fails. */
export class StartupError extends Error {
  constructor(
    message: string,
    readonly dbPath: string | null,
  ) {
    super(message);
    this.name = "StartupError";
  }
}
