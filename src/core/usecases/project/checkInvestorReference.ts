// Spec: BR-PRJ-001, BR-GEN-006
import { isArchived, parentArchivedError } from "../../domain/Archive";
import type { DomainError } from "../../domain/DomainError";
import { investorNotFoundError } from "../../domain/Project";
import type { InvestorRepository } from "../../ports/InvestorRepository";

/** BR-PRJ-001 / BR-GEN-006: the referenced investor must exist and be active. Returns null when valid. */
export async function checkInvestorReference(
  investorRepo: InvestorRepository,
  investorId: string,
): Promise<DomainError | null> {
  const investor = await investorRepo.get(investorId);
  if (!investor) return investorNotFoundError();
  if (isArchived(investor)) return parentArchivedError("investorId");
  return null;
}
