// Spec: AR-005, BR-GEN-004, BR-GEN-008
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type RestoreInvoice = (id: string) => Promise<Result<void>>;

/** Clears archivedAt, also when its contract is archived (BR-GEN-008); no-op for active invoices. */
export function makeRestoreInvoice({ invoiceRepo }: { invoiceRepo: InvoiceRepository }): RestoreInvoice {
  return async (id) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (isArchived(existing)) await invoiceRepo.restore(id);
    return ok(undefined);
  };
}
