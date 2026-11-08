// Spec: AR-005, UI-050, UI-002a, DM-050, BR-GEN-004
import { isInvoiceOverdue, localDateOnly, type InvoiceListRow } from "../../domain/Invoice";
import { ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { InvoiceListFilter, InvoiceRepository } from "../../ports/InvoiceRepository";

export type ListInvoices = (filter?: InvoiceListFilter) => Promise<Result<InvoiceListRow[]>>;

/** Lists invoices (date desc, number asc, id) with the overdue flag against the local date of the Clock (UI-050). */
export function makeListInvoices({
  invoiceRepo,
  clock,
}: {
  invoiceRepo: InvoiceRepository;
  clock: Clock;
}): ListInvoices {
  return async (filter = {}) => {
    const today = localDateOnly(clock.now());
    const invoices = await invoiceRepo.list(filter);
    return ok(invoices.map((invoice) => ({ ...invoice, overdue: isInvoiceOverdue(invoice, today) })));
  };
}
