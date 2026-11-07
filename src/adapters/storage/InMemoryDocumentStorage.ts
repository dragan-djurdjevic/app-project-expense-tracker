// Spec: AR-004, AR-009, DS-004
import type { StoredDocumentRef } from "../../core/domain/StoredDocumentRef";
import type { DocumentStorage } from "../../core/ports/DocumentStorage";
import type { IdGenerator } from "../../core/ports/IdGenerator";

/** Document storage kept in memory — tests and browser mode. */
export class InMemoryDocumentStorage implements DocumentStorage {
  private readonly files = new Map<string, Uint8Array>();

  constructor(private readonly ids: IdGenerator) {}

  async save(bytes: Uint8Array, originalName: string, ownerId: string): Promise<StoredDocumentRef> {
    const path = `${ownerId}/${this.ids.next()}.pdf`;
    this.files.set(path, bytes.slice());
    return { path, originalName };
  }

  async open(): Promise<void> {
    // No OS viewer in browser mode (AR-004).
  }

  async remove(ref: StoredDocumentRef): Promise<void> {
    this.files.delete(ref.path);
  }

  async exists(ref: StoredDocumentRef): Promise<boolean> {
    return this.files.has(ref.path);
  }

  clear(): void {
    this.files.clear();
  }
}
