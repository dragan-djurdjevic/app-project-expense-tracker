// Spec: AR-005, DM-000, DM-050, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-IVC-001, BR-IVC-003, BR-IVC-004, BR-IVC-005, BR-IVC-008, UI-051
import {
  DEFAULT_INVOICE_STATUS,
  INVOICE_STATUSES,
  invoiceNumberDuplicateError,
  validateInvoiceInput,
  type Invoice,
  type InvoiceInput,
  type InvoiceSaveResult,
  type InvoiceStatus,
} from "../../domain/Invoice";
import type { Clock } from "../../ports/Clock";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";
import type { SettingsRepository } from "../../ports/SettingsRepository";
import { checkContractReference, invoiceWarnings } from "./checkInvoiceReferences";

export { computeInvoiceAmounts, invoiceStatusOptions } from "../../domain/Invoice";

/** Statuses offered by the status filter (UI-050); a new invoice starts as DRAFT (DM-050). */
export const INVOICE_STATUS_OPTIONS: readonly InvoiceStatus[] = INVOICE_STATUSES;
export const INVOICE_STATUS_DEFAULT: InvoiceStatus = DEFAULT_INVOICE_STATUS;

export type CreateInvoice = (input: InvoiceInput) => Promise<InvoiceSaveResult>;

/**
 * Validation order per AR-005: field rules (vatRate defaults to settings.defaultVatRate, status to DRAFT and may be
 * DRAFT, ISSUED or CANCELLED), contract reference, BR-IVC-003. Returns the BR-IVC-008 warnings.
 */
export function makeCreateInvoice({
  invoiceRepo,
  contractRepo,
  settingsRepo,
  clock,
  ids,
}: {
  invoiceRepo: InvoiceRepository;
  contractRepo: ContractRepository;
  settingsRepo: SettingsRepository;
  clock: Clock;
  ids: IdGenerator;
}): CreateInvoice {
  return async (input) => {
    const settings = await settingsRepo.get();
    const fields = validateInvoiceInput(input, { vatRate: settings.defaultVatRate, status: DEFAULT_INVOICE_STATUS });
    if (!fields.ok) return fields;
    const contractError = await checkContractReference(contractRepo, fields.value.contractId);
    if (contractError) return { ok: false, error: contractError };
    if (await invoiceRepo.existsByNumber(fields.value.contractId, fields.value.number)) {
      return { ok: false, error: invoiceNumberDuplicateError() };
    }
    const now = clock.now().toISOString();
    const invoice: Invoice = {
      id: ids.next(),
      ...fields.value,
      attachment: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    const created = await invoiceRepo.create(invoice);
    return { ok: true, value: created, warnings: await invoiceWarnings(invoiceRepo, contractRepo, created.contractId) };
  };
}
