// Spec: AR-009
import type { SqlDriver } from "../adapters/sqlite/SqlDriver";
import type { InMemoryDocumentStorage } from "../adapters/storage/InMemoryDocumentStorage";

export interface TestHooks {
  reset(): Promise<void>;
  seed(fixtureName: string): Promise<void>;
}

declare global {
  interface Window {
    __TEST__?: TestHooks;
    __TAURI_INTERNALS__?: unknown;
  }
}

/** Named fixtures usable via `window.__TEST__.seed(name)`; fixtures are added by later milestones. */
export const fixtures: Record<string, (db: SqlDriver) => Promise<void>> = {};

const TABLES_CHILD_FIRST = ["invoice", "contract", "project", "subcontractor", "investor", "settings"];

export function makeTestHooks(db: SqlDriver, documents: InMemoryDocumentStorage): TestHooks {
  return {
    async reset() {
      await db.transaction(async (tx) => {
        for (const table of TABLES_CHILD_FIRST) {
          await tx.execute(`DELETE FROM ${table}`);
        }
        await tx.execute("INSERT INTO settings (id) VALUES (1)");
      });
      documents.clear();
    },
    async seed(fixtureName) {
      const fixture = fixtures[fixtureName];
      if (!fixture) {
        throw new Error(`Unknown fixture: ${fixtureName}`);
      }
      await fixture(db);
    },
  };
}
