// Spec: AR-004, DM-050, BR-IVC-003, UI-050
import type { ContractType } from "../domain/Contract";
import type { Invoice, InvoiceFields, InvoiceListItem, InvoiceStatus } from "../domain/Invoice";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface InvoiceListFilter extends BaseListFilter {
  contractId?: string;
  projectId?: string;
  /** Any of these statuses; empty or omitted = all. */
  status?: InvoiceStatus[];
  /** Type of the invoice's contract. */
  direction?: ContractType;
}

export interface InvoiceRepository extends Omit<EntityRepository<Invoice, InvoiceFields, InvoiceListFilter>, "list"> {
  /**
   * Invoices with contract number, project, direction, VAT amount and gross (UI-050). Search over number, contract
   * number, project name and description; sorted by date desc, number asc (case-insensitive), id.
   */
  list(filter: InvoiceListFilter): Promise<InvoiceListItem[]>;
  /** BR-IVC-003: case-insensitive as SQLite `COLLATE NOCASE` (ASCII letters only); includes archived invoices. */
  existsByNumber(contractId: string, number: string, excludeId?: string): Promise<boolean>;
}
