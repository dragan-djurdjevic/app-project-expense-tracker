// Spec: AR-005, DM-050, DS-004, UI-050, UI-053
import { ok, type Result } from "../../domain/Result";
import type { DocumentStorage } from "../../ports/DocumentStorage";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type OpenInvoiceDocument = (id: string) => Promise<Result<void>>;

/** Opens the attachment in the OS default PDF viewer (DS-004); allowed for archived invoices too (DM-050). */
export function makeOpenInvoiceDocument({
  invoiceRepo,
  documents,
}: {
  invoiceRepo: InvoiceRepository;
  documents: DocumentStorage;
}): OpenInvoiceDocument {
  return async (id) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (!existing.attachment) throw new Error(`Invoice has no attachment: ${id}`);
    await documents.open(existing.attachment);
    return ok(undefined);
  };
}
