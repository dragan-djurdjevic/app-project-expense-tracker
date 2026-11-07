// Spec: AR-005, BR-GEN-004
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { InvestorRepository } from "../../ports/InvestorRepository";

export type RestoreInvestor = (id: string) => Promise<Result<void>>;

/** Clears archivedAt; restoring an active investor changes nothing. */
export function makeRestoreInvestor({ investorRepo }: { investorRepo: InvestorRepository }): RestoreInvestor {
  return async (id) => {
    const existing = await investorRepo.get(id);
    if (!existing) throw new Error(`Investor not found: ${id}`);
    if (isArchived(existing)) await investorRepo.restore(id);
    return ok(undefined);
  };
}
