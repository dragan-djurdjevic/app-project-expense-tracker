// Spec: AR-005, DM-030, UI-032
import type { ProjectDetails, ProjectSummary } from "../../domain/Project";
import { ok, type Result } from "../../domain/Result";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";

/** Returns the project with its investor's name and summary cards, or null when no project has this id. */
export type GetProject = (id: string) => Promise<Result<ProjectDetails | null>>;

export function makeGetProject({
  projectRepo,
  investorRepo,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
}): GetProject {
  return async (id) => {
    const project = await projectRepo.get(id);
    if (!project) return ok(null);
    const investor = await investorRepo.get(project.investorId);
    // Contracts arrive in M3 and invoices in M4 (UI-032); until then every summary value is 0.
    const summary: ProjectSummary = { contracted: 0, collected: 0, contractedOut: 0, paidOut: 0, net: 0 };
    return ok({ ...project, investorName: investor?.name ?? "", summary });
  };
}
