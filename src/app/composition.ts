// Spec: AR-001, AR-002, AR-003, AR-009, AR-010, DS-001, DS-004
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { bundledMigrations } from "../adapters/sqlite/bundledMigrations";
import { ensureSettingsRow, runMigrations } from "../adapters/sqlite/runMigrations";
import type { SqlDriver } from "../adapters/sqlite/SqlDriver";
import { SqliteSettingsRepository } from "../adapters/sqlite/SqliteSettingsRepository";
import { SqlJsDriver } from "../adapters/sqlite/SqlJsDriver";
import { FsDocumentStorage } from "../adapters/storage/FsDocumentStorage";
import { InMemoryDocumentStorage } from "../adapters/storage/InMemoryDocumentStorage";
import { SystemClock } from "../adapters/system/SystemClock";
import { UuidIdGenerator } from "../adapters/system/UuidIdGenerator";
import { getDataDir, isTauriRuntime, joinPath, openInOs } from "../adapters/tauri/platform";
import { TauriSqlDriver } from "../adapters/tauri/TauriSqlDriver";
import type { DocumentStorage } from "../core/ports/DocumentStorage";
import { makeGetSettings } from "../core/usecases/settings/getSettings";
import { makeUpdateSettings } from "../core/usecases/settings/updateSettings";
import { StartupError, type Container, type RuntimeInfo } from "./Container";
import { makeTestHooks } from "./testHooks";

const DB_FILE = "tracker.db";
const DOCUMENTS_DIR = "documents";

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Builds the container; runs the startup sequence of AR-010 (steps 1–3). */
export async function createContainer(): Promise<Container> {
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();

  let db: SqlDriver;
  let documents: DocumentStorage;
  let runtime: RuntimeInfo;
  let dbPath: string | null = null;
  let inMemoryDocuments: InMemoryDocumentStorage | null = null;

  try {
    if (isTauriRuntime()) {
      const dataDir = await getDataDir();
      dbPath = await joinPath(dataDir, DB_FILE);
      const documentsPath = await joinPath(dataDir, DOCUMENTS_DIR);
      db = await TauriSqlDriver.open(dbPath);
      documents = new FsDocumentStorage(documentsPath, ids);
      runtime = { mode: "tauri", dbPath, documentsPath, openFolder: openInOs };
    } else {
      db = await SqlJsDriver.create({ locateFile: () => wasmUrl });
      inMemoryDocuments = new InMemoryDocumentStorage(ids);
      documents = inMemoryDocuments;
      runtime = { mode: "browser", dbPath: null, documentsPath: null, openFolder: null };
    }
    await runMigrations(db, bundledMigrations(), clock);
    await ensureSettingsRow(db);
  } catch (error) {
    throw new StartupError(message(error), dbPath);
  }

  // DocumentStorage is chosen per mode here; the invoice use cases that consume it arrive in M4.
  void documents;

  const settingsRepo = new SqliteSettingsRepository(db);

  if (inMemoryDocuments && import.meta.env.MODE === "e2e") {
    window.__TEST__ = makeTestHooks(db, inMemoryDocuments);
  }

  return {
    useCases: {
      getSettings: makeGetSettings({ settingsRepo }),
      updateSettings: makeUpdateSettings({ settingsRepo }),
    },
    runtime,
  };
}
