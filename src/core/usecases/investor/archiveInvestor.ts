// Spec: AR-005, BR-GEN-004, BR-GEN-005
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { InvestorRepository } from "../../ports/InvestorRepository";

export type ArchiveInvestor = (id: string) => Promise<Result<void>>;

/** Sets archivedAt; archiving an archived investor is a no-op success. Projects are not archived (BR-GEN-005). */
export function makeArchiveInvestor({ investorRepo }: { investorRepo: InvestorRepository }): ArchiveInvestor {
  return async (id) => {
    const existing = await investorRepo.get(id);
    if (!existing) throw new Error(`Investor not found: ${id}`);
    if (!isArchived(existing)) await investorRepo.archive(id);
    return ok(undefined);
  };
}
