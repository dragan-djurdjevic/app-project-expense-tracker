// Spec: AR-005, DM-000, DM-050, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-GEN-007, BR-IVC-002, BR-IVC-003, BR-IVC-004, BR-IVC-005, BR-IVC-008
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import {
  invoiceImmutableError,
  invoiceNumberDuplicateError,
  validateInvoiceInput,
  type InvoiceInput,
  type InvoiceSaveResult,
} from "../../domain/Invoice";
import type { Clock } from "../../ports/Clock";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";
import { invoiceWarnings } from "./checkInvoiceReferences";

export type UpdateInvoice = (id: string, input: InvoiceInput) => Promise<InvoiceSaveResult>;

/**
 * Order per AR-005: BR-GEN-007, BR-IVC-002, field rules (a changed status must be an allowed transition from the
 * stored status, BR-IVC-005; omitted vatRate / status keep the stored values), BR-IVC-003. The contract cannot
 * change, so its reference is not re-checked (BR-GEN-006). Keeps the attachment; returns the BR-IVC-008 warnings.
 */
export function makeUpdateInvoice({
  invoiceRepo,
  contractRepo,
  clock,
}: {
  invoiceRepo: InvoiceRepository;
  contractRepo: ContractRepository;
  clock: Clock;
}): UpdateInvoice {
  return async (id, input) => {
    const existing = await invoiceRepo.get(id);
    if (!existing) throw new Error(`Invoice not found: ${id}`);
    if (isArchived(existing)) return { ok: false, error: archivedReadOnlyError() };
    if ((input.contractId ?? "").trim() !== existing.contractId) return { ok: false, error: invoiceImmutableError() };
    const fields = validateInvoiceInput(input, { vatRate: existing.vatRate, status: existing.status });
    if (!fields.ok) return fields;
    if (await invoiceRepo.existsByNumber(existing.contractId, fields.value.number, id)) {
      return { ok: false, error: invoiceNumberDuplicateError() };
    }
    const updated = await invoiceRepo.update(id, {
      ...fields.value,
      attachment: existing.attachment,
      updatedAt: clock.now().toISOString(),
    });
    return { ok: true, value: updated, warnings: await invoiceWarnings(invoiceRepo, contractRepo, updated.contractId) };
  };
}
