// Spec: AR-005, UI-030, UI-002a, AN-3, BR-GEN-004
import type { ProjectListItem } from "../../domain/Project";
import { ok, type Result } from "../../domain/Result";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectListFilter, ProjectRepository } from "../../ports/ProjectRepository";

export type ListProjects = (filter?: ProjectListFilter) => Promise<Result<ProjectListItem[]>>;

/** Lists projects (deadline asc, nulls last) with their investor's name (archived investors included). */
export function makeListProjects({
  projectRepo,
  investorRepo,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
}): ListProjects {
  return async (filter = {}) => {
    const [projects, investors] = await Promise.all([
      projectRepo.list(filter),
      investorRepo.list({ includeArchived: true }),
    ]);
    const names = new Map(investors.map((investor) => [investor.id, investor.name]));
    return ok(projects.map((project) => ({ ...project, investorName: names.get(project.investorId) ?? "" })));
  };
}
