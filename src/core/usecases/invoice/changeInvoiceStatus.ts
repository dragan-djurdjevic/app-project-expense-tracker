// Spec: AR-005, DM-050, BR-IVC-005, BR-GEN-007
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import {
  canChangeInvoiceStatus,
  invoiceFields,
  isInvoiceStatus,
  statusTransitionError,
  type Invoice,
} from "../../domain/Invoice";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

export type ChangeInvoiceStatus = (id: string, status: string) => Promise<Result<Invoice>>;

/**
 * BR-IVC-005: the new status must be an allowed transition from the stored status; the same status is a no-op
 * success (record and updatedAt unchanged). Archived invoices return BR-GEN-007 (DM-050).
 */
export function makeChangeInvoiceStatus({
  invoiceRepo,
  clock,
}: {
  invoiceRepo: InvoiceRepository;
  clock: Clock;
}): ChangeInvoiceStatus {
  return async (id, status) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    if (!isInvoiceStatus(status) || !canChangeInvoiceStatus(existing.status, status)) {
      return err(statusTransitionError());
    }
    if (status === existing.status) return ok(existing);
    return ok(
      await invoiceRepo.update(id, { ...invoiceFields(existing), status, updatedAt: clock.now().toISOString() }),
    );
  };
}
