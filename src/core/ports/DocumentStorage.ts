// Spec: AR-004, DS-004
import type { StoredDocumentRef } from "../domain/StoredDocumentRef";

export interface DocumentStorage {
  /** Stores the bytes as `<ownerId>/<uuid>.pdf` (ownerId = invoice id). */
  save(bytes: Uint8Array, originalName: string, ownerId: string): Promise<StoredDocumentRef>;
  /** Opens the document in the OS viewer (no-op in browser mode). */
  open(ref: StoredDocumentRef): Promise<void>;
  remove(ref: StoredDocumentRef): Promise<void>;
  exists(ref: StoredDocumentRef): Promise<boolean>;
}
