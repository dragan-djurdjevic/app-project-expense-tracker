// Spec: DM-050, DM-001, AR-004, AR-005, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-IVC-001, BR-IVC-002, BR-IVC-003, BR-IVC-004, BR-IVC-005, BR-IVC-006, BR-IVC-008, UI-050
import type { ContractType } from "./Contract";
import { createDateOnly, type DateOnly } from "./DateOnly";
import { domainError, requiredError, type DomainError } from "./DomainError";
import type { Entity } from "./Entity";
import { createMoney, type Money } from "./Money";
import { err, ok, type Result } from "./Result";
import type { StoredDocumentRef } from "./StoredDocumentRef";
import { optionalText, requiredText } from "./Text";
import { createVatRate, type VatRate } from "./VatRate";

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PAID", "CANCELLED"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const DEFAULT_INVOICE_STATUS: InvoiceStatus = "DRAFT";

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

/** The persisted fields of an invoice (input of `InvoiceRepository.update`). */
export function invoiceFields(invoice: Invoice): InvoiceFields {
  const { number, contractId, value, vatRate, date, dueDate, status, description, attachment } = invoice;
  return { number, contractId, value, vatRate, date, dueDate, status, description, attachment };
}

/** Fields set from the invoice form (UI-051); the attachment is changed by its own use cases (UI-053). */
export type InvoiceFormFields = Omit<InvoiceFields, "attachment">;

/** Invoice as returned by `InvoiceRepository.list` (AR-004). */
export interface InvoiceListItem extends Invoice {
  contractNumber: string;
  projectId: string;
  projectName: string;
  /** Type of the invoice's contract (DM-050). */
  direction: ContractType;
  vatAmount: Money;
  gross: Money;
}

/** Invoice as shown in the Invoices list (UI-050). */
export interface InvoiceListRow extends InvoiceListItem {
  /** UI-050: status ISSUED and dueDate before the local calendar date of `Clock.now()`. */
  overdue: boolean;
}

/** BR-IVC-008 warning returned by `createInvoice` / `updateInvoice` (AR-005). */
export type InvoiceWarning = "overInvoiced";

/** AR-005 exception: a successful invoice save carries its warnings (`[]` when there is none). */
export type InvoiceSaveResult =
  { ok: true; value: Invoice; warnings: InvoiceWarning[] } | { ok: false; error: DomainError };

/**
 * Raw form input for create and update (UI-051); update input has the same shape (BR-IVC-002).
 * `value` null = empty input (BR-GEN-002); `vatRate` / `status` null or omitted = default (DM-050).
 */
export interface InvoiceInput {
  contractId: string;
  number: string;
  date: string;
  dueDate?: string | null;
  value: number | null;
  vatRate?: number | null;
  status?: string | null;
  description?: string | null;
}

/** A file chosen for attachment (UI-053). */
export interface InvoiceAttachmentFile {
  name: string;
  bytes: Uint8Array;
}

/** BR-IVC-006: 20 × 1024 × 1024 bytes. */
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/** BR-IVC-005: allowed status transitions. */
const TRANSITIONS: Readonly<Record<InvoiceStatus, readonly InvoiceStatus[]>> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PAID", "CANCELLED", "DRAFT"],
  PAID: ["ISSUED"],
  CANCELLED: [],
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

/** BR-IVC-005: true for an allowed transition or the same status (no-op). */
export function canChangeInvoiceStatus(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

/** BR-IVC-005 / UI-051: the current status first, then the allowed next statuses in enum order. */
export function invoiceStatusOptions(current: InvoiceStatus): InvoiceStatus[] {
  return [current, ...INVOICE_STATUSES.filter((status) => TRANSITIONS[current].includes(status))];
}

/**
 * DM-050: `vatAmount = round_half_up(value × vatRate / 10000)`, `gross = value + vatAmount`; exact for every
 * Money × VatRate (the product is split to stay within safe integers).
 */
export function computeInvoiceAmounts(value: Money, vatRate: VatRate): { vatAmount: Money; gross: Money } {
  const high = Math.floor(value / 10_000);
  const low = value - high * 10_000;
  const vatAmount = high * vatRate + Math.floor((low * vatRate + 5_000) / 10_000);
  return { vatAmount, gross: value + vatAmount };
}

/** UI-050 overdue rule; `today` is the local calendar date of `Clock.now()`. */
export function isInvoiceOverdue(invoice: Pick<Invoice, "status" | "dueDate">, today: DateOnly): boolean {
  return invoice.status === "ISSUED" && invoice.dueDate !== null && invoice.dueDate < today;
}

/** Local calendar date of a timestamp as ISO `YYYY-MM-DD`. */
export function localDateOnly(date: Date): DateOnly {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** BR-IVC-001: unknown contract. */
export const contractNotFoundError = (): DomainError => domainError("BR-IVC-001", "errors.notFound", "contractId");
/** BR-IVC-002: contractId changed on update. */
export const invoiceImmutableError = (): DomainError => domainError("BR-IVC-002", "errors.immutable", "contractId");
/** BR-IVC-003: number already used on the contract. */
export const invoiceNumberDuplicateError = (): DomainError =>
  domainError("BR-IVC-003", "errors.invoice.numberDuplicate", "number");
/** BR-IVC-004: due date before the invoice date. */
export const dueBeforeDateError = (): DomainError =>
  domainError("BR-IVC-004", "errors.invoice.dueBeforeDate", "dueDate");
/** BR-IVC-005: status not allowed (on create) or transition not allowed. */
export const statusTransitionError = (): DomainError =>
  domainError("BR-IVC-005", "errors.invoice.statusTransition", "status");
/** BR-IVC-006: not a PDF. */
export const notPdfError = (): DomainError => domainError("BR-IVC-006", "errors.attachment.notPdf", "attachment");
/** BR-IVC-006: larger than 20 MB. */
export const tooLargeError = (): DomainError => domainError("BR-IVC-006", "errors.attachment.tooLarge", "attachment");

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d];

/** BR-IVC-006: PDF check (extension `.pdf` case-insensitive and `%PDF-` magic bytes) first, then the size. */
export function validateAttachment(file: InvoiceAttachmentFile): DomainError | null {
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") &&
    file.bytes.length >= PDF_MAGIC.length &&
    PDF_MAGIC.every((byte, index) => file.bytes[index] === byte);
  if (!isPdf) return notPdfError();
  if (file.bytes.length > ATTACHMENT_MAX_BYTES) return tooLargeError();
  return null;
}

const trimmed = (value: string | null | undefined): string => (value ?? "").trim();

/**
 * Validates the DM-050 field rules in form field order (AR-005 step 1): contractId, number, date, dueDate
 * (BR-IVC-004), value, vatRate, status (BR-IVC-005 from `defaults.status`), description. Omitted vatRate / status
 * take `defaults`. The contract reference and uniqueness are checked by the use cases.
 */
export function validateInvoiceInput(
  input: InvoiceInput,
  defaults: { vatRate: VatRate; status: InvoiceStatus },
): Result<InvoiceFormFields> {
  const contractId = trimmed(input.contractId);
  if (contractId === "") return err(requiredError("contractId"));
  const number = requiredText(input.number, 50, "number");
  if (!number.ok) return number;
  const date = createDateOnly(input.date ?? "", "date");
  if (!date.ok) return date;
  let dueDate: DateOnly | null = null;
  if (trimmed(input.dueDate) !== "") {
    const parsed = createDateOnly(trimmed(input.dueDate), "dueDate");
    if (!parsed.ok) return parsed;
    if (parsed.value < date.value) return err(dueBeforeDateError());
    dueDate = parsed.value;
  }
  if (input.value === null || input.value === undefined) return err(requiredError("value"));
  const value = createMoney(input.value, "value");
  if (!value.ok) return value;
  const vatRate = createVatRate(input.vatRate ?? defaults.vatRate, "vatRate");
  if (!vatRate.ok) return vatRate;
  const statusText = trimmed(input.status);
  const status = statusText === "" ? defaults.status : statusText;
  if (!isInvoiceStatus(status) || !canChangeInvoiceStatus(defaults.status, status)) {
    return err(statusTransitionError());
  }
  const description = optionalText(input.description, 1000, "description");
  if (!description.ok) return description;
  return ok({
    number: number.value,
    contractId,
    value: value.value,
    vatRate: vatRate.value,
    date: date.value,
    dueDate,
    status,
    description: description.value,
  });
}
