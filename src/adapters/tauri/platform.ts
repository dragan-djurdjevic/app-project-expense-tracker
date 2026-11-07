// Spec: AR-009, UI-080, DS-004
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Effective data dir: `ARCHTRACKER_DATA_DIR` or the app data dir (resolved by the Rust side). */
export function getDataDir(): Promise<string> {
  return invoke<string>("get_data_dir");
}

export function joinPath(...parts: string[]): Promise<string> {
  return join(...parts);
}

/** Opens a file or folder with the OS default handler. */
export function openInOs(path: string): Promise<void> {
  return openPath(path);
}
