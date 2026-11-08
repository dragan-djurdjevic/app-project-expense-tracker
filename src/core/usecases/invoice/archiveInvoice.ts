// Spec: AR-005, BR-GEN-004, BR-IVC-007
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type ArchiveInvoice = (id: string) => Promise<Result<void>>;

/** Sets archivedAt and keeps the attachment file (BR-IVC-007); archiving an archived invoice is a no-op success. */
export function makeArchiveInvoice({ invoiceRepo }: { invoiceRepo: InvoiceRepository }): ArchiveInvoice {
  return async (id) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (!isArchived(existing)) await invoiceRepo.archive(id);
    return ok(undefined);
  };
}
