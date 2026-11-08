// Spec: AR-005, DM-050, BR-IVC-007, BR-GEN-007, DS-004
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import { invoiceFields, type Invoice } from "../../domain/Invoice";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { DocumentStorage } from "../../ports/DocumentStorage";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type RemoveInvoiceDocument = (id: string) => Promise<Result<Invoice>>;

/**
 * BR-IVC-007: clears attachment path and name and deletes the stored file; no-op without an attachment.
 * Archived invoices return BR-GEN-007.
 */
export function makeRemoveInvoiceDocument({
  invoiceRepo,
  documents,
  clock,
}: {
  invoiceRepo: InvoiceRepository;
  documents: DocumentStorage;
  clock: Clock;
}): RemoveInvoiceDocument {
  return async (id) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    if (!existing.attachment) return ok(existing);
    const updated = await invoiceRepo.update(id, {
      ...invoiceFields(existing),
      attachment: null,
      updatedAt: clock.now().toISOString(),
    });
    await documents.remove(existing.attachment);
    return ok(updated);
  };
}
