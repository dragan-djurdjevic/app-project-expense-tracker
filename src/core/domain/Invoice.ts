// Spec: DM-050
import type { DateOnly } from "./DateOnly";
import type { Entity } from "./Entity";
import type { Money } from "./Money";
import type { StoredDocumentRef } from "./StoredDocumentRef";
import type { VatRate } from "./VatRate";

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "CANCELLED"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceFields {
  number: string;
  contractId: string;
  value: Money;
  vatRate: VatRate;
  date: DateOnly;
  dueDate: DateOnly | null;
  status: InvoiceStatus;
  description: string | null;
  attachment: StoredDocumentRef | null;
}

export interface Invoice extends Entity, InvoiceFields {}
