// Spec: AR-009, AR-013, UI-080, UI-081, UI-053, DS-004
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import type { InvoiceAttachmentFile } from "../../core/domain/Invoice";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** AR-013: the active profile's data dir under `<root>` (`ARCHTRACKER_DATA_DIR` or the app data dir). */
export function getDataDir(): Promise<string> {
  return invoke<string>("get_data_dir");
}

/** AR-013: the active profile as resolved by the Rust side from `<root>/profile.json`. */
export async function getProfile(): Promise<"live" | "demo"> {
  return (await invoke<string>("get_profile")) === "demo" ? "demo" : "live";
}

/** AR-013: writes `profile.json` and restarts the app. */
export function switchProfile(profile: "live" | "demo"): Promise<void> {
  return invoke<void>("switch_profile", { profile });
}

/** AR-013: marks the demo data for deletion at the next start and restarts the app. */
export function resetDemo(): Promise<void> {
  return invoke<void>("reset_demo");
}

export function joinPath(...parts: string[]): Promise<string> {
  return join(...parts);
}

/** Opens a file or folder with the OS default handler. */
export function openInOs(path: string): Promise<void> {
  return openPath(path);
}

/** UI-053: native file dialog filtered to `*.pdf`; returns the chosen file's name and bytes, or null when cancelled. */
export async function pickPdfFile(): Promise<InvoiceAttachmentFile | null> {
  const path = await open({ multiple: false, directory: false, filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (path === null) return null;
  const bytes = await readFile(path);
  return { name: path.split(/[\\/]/).pop() ?? path, bytes };
}
