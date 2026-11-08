// Spec: AR-009, UI-080, UI-053, DS-004
import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import type { InvoiceAttachmentFile } from "../../core/domain/Invoice";

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

/** UI-053: native file dialog filtered to `*.pdf`; returns the chosen file's name and bytes, or null when cancelled. */
export async function pickPdfFile(): Promise<InvoiceAttachmentFile | null> {
  const path = await open({ multiple: false, directory: false, filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (path === null) return null;
  const bytes = await readFile(path);
  return { name: path.split(/[\\/]/).pop() ?? path, bytes };
}
