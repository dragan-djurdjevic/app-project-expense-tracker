// Spec: AR-004, DM-050, DM-060, DS-004
import {
  computeInvoiceAmounts,
  type Invoice,
  type InvoiceFields,
  type InvoiceListItem,
} from "../../../src/core/domain/Invoice";
import type { Settings } from "../../../src/core/domain/Settings";
import type { StoredDocumentRef } from "../../../src/core/domain/StoredDocumentRef";
import type { Clock } from "../../../src/core/ports/Clock";
import type { DocumentStorage } from "../../../src/core/ports/DocumentStorage";
import type { InvoiceListFilter, InvoiceRepository } from "../../../src/core/ports/InvoiceRepository";
import type { SettingsRepository } from "../../../src/core/ports/SettingsRepository";

/** In-memory InvoiceRepository for core unit tests (no DB); list items carry no joined contract data. */
export class InMemoryInvoiceRepository implements InvoiceRepository {
  readonly rows = new Map<string, Invoice>();

  constructor(private readonly clock: Clock) {}

  async list(filter: InvoiceListFilter): Promise<InvoiceListItem[]> {
    return [...this.rows.values()]
      .filter((row) => filter.includeArchived || row.archivedAt === null)
      .filter((row) => filter.contractId === undefined || row.contractId === filter.contractId)
      .map((row) => ({
        ...row,
        contractNumber: "",
        projectId: "",
        projectName: "",
        direction: "INCOMING",
        ...computeInvoiceAmounts(row.value, row.vatRate),
      }));
  }

  async get(id: string): Promise<Invoice | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: Invoice): Promise<Invoice> {
    this.rows.set(input.id, input);
    return input;
  }

  async update(id: string, input: InvoiceFields & { updatedAt: string }): Promise<Invoice> {
    const updated = { ...(this.rows.get(id) as Invoice), ...input };
    this.rows.set(id, updated);
    return updated;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    this.rows.set(id, { ...(this.rows.get(id) as Invoice), archivedAt: now, updatedAt: now });
  }

  async restore(id: string): Promise<void> {
    this.rows.set(id, {
      ...(this.rows.get(id) as Invoice),
      archivedAt: null,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  async existsByNumber(contractId: string, number: string, excludeId?: string): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) =>
        row.contractId === contractId && row.number.toLowerCase() === number.toLowerCase() && row.id !== excludeId,
    );
  }
}

export class InMemorySettingsRepository implements SettingsRepository {
  constructor(public settings: Settings) {}

  async get(): Promise<Settings> {
    return this.settings;
  }

  async update(settings: Settings): Promise<void> {
    this.settings = settings;
  }
}

/** DocumentStorage fake keeping files in a map; paths `<ownerId>/doc-<n>.pdf`. */
export class FakeDocumentStorage implements DocumentStorage {
  readonly files = new Map<string, Uint8Array>();
  private counter = 0;

  async save(bytes: Uint8Array, originalName: string, ownerId: string): Promise<StoredDocumentRef> {
    const path = `${ownerId}/doc-${++this.counter}.pdf`;
    this.files.set(path, bytes);
    return { path, originalName };
  }

  async open(): Promise<void> {}

  async remove(ref: StoredDocumentRef): Promise<void> {
    this.files.delete(ref.path);
  }

  async exists(ref: StoredDocumentRef): Promise<boolean> {
    return this.files.has(ref.path);
  }
}
