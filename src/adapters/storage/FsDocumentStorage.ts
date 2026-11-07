// Spec: AR-004, AR-009, DS-004
import { exists, mkdir, remove, writeFile } from "@tauri-apps/plugin-fs";
import type { StoredDocumentRef } from "../../core/domain/StoredDocumentRef";
import type { DocumentStorage } from "../../core/ports/DocumentStorage";
import type { IdGenerator } from "../../core/ports/IdGenerator";
import { joinPath, openInOs } from "../tauri/platform";

/** Stores documents as files under `<dataDir>/documents/` (Tauri mode). */
export class FsDocumentStorage implements DocumentStorage {
  constructor(
    private readonly root: string,
    private readonly ids: IdGenerator,
  ) {}

  async save(bytes: Uint8Array, originalName: string, ownerId: string): Promise<StoredDocumentRef> {
    const fileName = `${this.ids.next()}.pdf`;
    await mkdir(await joinPath(this.root, ownerId), { recursive: true });
    await writeFile(await joinPath(this.root, ownerId, fileName), bytes);
    return { path: `${ownerId}/${fileName}`, originalName };
  }

  async open(ref: StoredDocumentRef): Promise<void> {
    await openInOs(await this.absolute(ref));
  }

  async remove(ref: StoredDocumentRef): Promise<void> {
    const path = await this.absolute(ref);
    if (await exists(path)) {
      await remove(path);
    }
  }

  async exists(ref: StoredDocumentRef): Promise<boolean> {
    return exists(await this.absolute(ref));
  }

  private absolute(ref: StoredDocumentRef): Promise<string> {
    return joinPath(this.root, ...ref.path.split("/"));
  }
}
