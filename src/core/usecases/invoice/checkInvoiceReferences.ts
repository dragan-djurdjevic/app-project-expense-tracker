// Spec: BR-IVC-001, BR-IVC-008, BR-GEN-006, AR-005
import { isArchived, parentArchivedError } from "../../domain/Archive";
import type { DomainError } from "../../domain/DomainError";
import { contractNotFoundError, type InvoiceWarning } from "../../domain/Invoice";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";

/** BR-IVC-001 / BR-GEN-006: the contract must exist and be active. Returns null when valid. */
export async function checkContractReference(
  contractRepo: ContractRepository,
  contractId: string,
): Promise<DomainError | null> {
  const contract = await contractRepo.get(contractId);
  if (!contract) return contractNotFoundError();
  if (isArchived(contract)) return parentArchivedError("contractId");
  return null;
}

/**
 * BR-IVC-008: "overInvoiced" when Σ values of non-cancelled invoices on the contract (archived invoices and the
 * saved invoice included) exceed the contract value.
 */
export async function invoiceWarnings(
  invoiceRepo: InvoiceRepository,
  contractRepo: ContractRepository,
  contractId: string,
): Promise<InvoiceWarning[]> {
  const [contract, invoices] = await Promise.all([
    contractRepo.get(contractId),
    invoiceRepo.list({ contractId, includeArchived: true }),
  ]);
  if (!contract) throw new Error(`Contract not found: ${contractId}`);
  const invoiced = invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .reduce((total, invoice) => total + invoice.value, 0);
  return invoiced > contract.value ? ["overInvoiced"] : [];
}
