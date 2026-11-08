// Spec: AR-009, AR-007, DS-004
import type { SqlDriver } from "../adapters/sqlite/SqlDriver";
import type { InMemoryDocumentStorage } from "../adapters/storage/InMemoryDocumentStorage";
import type { DocumentStorage } from "../core/ports/DocumentStorage";

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

/** A named seed fixture (`tests/fixtures/*.ts`) writing rows directly through the SqlDriver and attachments to the documents. */
export type Fixture = (db: SqlDriver, documents: DocumentStorage) => Promise<void>;

const TABLES_CHILD_FIRST = ["invoice", "contract", "project", "subcontractor", "investor", "settings"];

/** Hooks for E2E tests; `fixtures` are the fixtures usable via `window.__TEST__.seed(name)`. */
export function makeTestHooks(
  db: SqlDriver,
  documents: InMemoryDocumentStorage,
  fixtures: Record<string, Fixture>,
): TestHooks {
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
      await fixture(db, documents);
    },
  };
}
