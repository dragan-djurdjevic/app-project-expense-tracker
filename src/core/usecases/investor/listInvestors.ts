// Spec: AR-005, UI-010, UI-002a, BR-GEN-004
import type { InvestorListItem } from "../../domain/Investor";
import { ok, type Result } from "../../domain/Result";
import type { InvestorListFilter, InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";

export type ListInvestors = (filter?: InvestorListFilter) => Promise<Result<InvestorListItem[]>>;

/** Lists investors sorted by name with the count of their active (non-archived) projects. */
export function makeListInvestors({
  investorRepo,
  projectRepo,
}: {
  investorRepo: InvestorRepository;
  projectRepo: ProjectRepository;
}): ListInvestors {
  return async (filter = {}) => {
    const [investors, activeProjects] = await Promise.all([investorRepo.list(filter), projectRepo.list({})]);
    const counts = new Map<string, number>();
    for (const project of activeProjects) {
      counts.set(project.investorId, (counts.get(project.investorId) ?? 0) + 1);
    }
    return ok(investors.map((investor) => ({ ...investor, projectCount: counts.get(investor.id) ?? 0 })));
  };
}
