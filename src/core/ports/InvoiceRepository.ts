// Spec: AR-004, DM-050
import type { Invoice, InvoiceFields, InvoiceStatus } from "../domain/Invoice";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface InvoiceListFilter extends BaseListFilter {
  contractId?: string;
  projectId?: string;
  status?: InvoiceStatus[];
}

export type InvoiceRepository = EntityRepository<Invoice, InvoiceFields, InvoiceListFilter>;
