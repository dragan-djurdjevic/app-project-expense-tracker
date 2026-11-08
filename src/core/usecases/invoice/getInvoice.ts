// Spec: AR-005, DM-050
import type { Invoice } from "../../domain/Invoice";
import { ok, type Result } from "../../domain/Result";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

/** Returns the invoice, or null when no invoice has this id. */
export type GetInvoice = (id: string) => Promise<Result<Invoice | null>>;

export function makeGetInvoice({ invoiceRepo }: { invoiceRepo: InvoiceRepository }): GetInvoice {
  return async (id) => ok(await invoiceRepo.get(id));
}
