// Spec: AR-005, DM-050, BR-IVC-006, BR-IVC-007, BR-GEN-007, DS-004
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import type { DomainError } from "../../domain/DomainError";
import { invoiceFields, validateAttachment, type Invoice, type InvoiceAttachmentFile } from "../../domain/Invoice";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { DocumentStorage } from "../../ports/DocumentStorage";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type AttachInvoiceDocument = (id: string, file: InvoiceAttachmentFile) => Promise<Result<Invoice>>;

/** BR-IVC-006 check used by the attachment block before saving (UI-053); null when the file is acceptable. */
export function checkInvoiceAttachment(file: InvoiceAttachmentFile): DomainError | null {
  return validateAttachment(file);
}

/**
 * Stores the PDF as `<invoiceId>/<uuid>.pdf` (DS-004) and records path and original name; a replaced attachment's
 * stored file is removed (BR-IVC-007). Archived invoices return BR-GEN-007.
 */
export function makeAttachInvoiceDocument({
  invoiceRepo,
  documents,
  clock,
}: {
  invoiceRepo: InvoiceRepository;
  documents: DocumentStorage;
  clock: Clock;
}): AttachInvoiceDocument {
  return async (id, file) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    const fileError = validateAttachment(file);
    if (fileError) return err(fileError);
    const attachment = await documents.save(file.bytes, file.name, id);
    const updated = await invoiceRepo.update(id, {
      ...invoiceFields(existing),
      attachment,
      updatedAt: clock.now().toISOString(),
    });
    if (existing.attachment) await documents.remove(existing.attachment);
    return ok(updated);
  };
}
