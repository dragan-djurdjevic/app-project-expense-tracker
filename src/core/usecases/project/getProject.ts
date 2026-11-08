// Spec: AR-005, DM-030, DM-040, UI-032
import type { ProjectDetails, ProjectSummary } from "../../domain/Project";
import { ok, type Result } from "../../domain/Result";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";

/** Returns the project with its investor's name and summary cards, or null when no project has this id. */
export type GetProject = (id: string) => Promise<Result<ProjectDetails | null>>;

/**
 * Summary cards (UI-032, all years, net): contracted = Σ INCOMING values, contracted to subcontractors = Σ OUTGOING
 * values, archived contracts included. Collected and paid come with invoices (M4) and are 0 until then.
 */
export function makeGetProject({
  projectRepo,
  investorRepo,
  contractRepo,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
  contractRepo: ContractRepository;
}): GetProject {
  return async (id) => {
    const project = await projectRepo.get(id);
    if (!project) return ok(null);
    const [investor, contracts] = await Promise.all([
      investorRepo.get(project.investorId),
      contractRepo.list({ projectId: id, includeArchived: true }),
    ]);
    const sum = (type: "INCOMING" | "OUTGOING") =>
      contracts.filter((contract) => contract.type === type).reduce((total, contract) => total + contract.value, 0);
    const collected = 0;
    const paidOut = 0;
    const summary: ProjectSummary = {
      contracted: sum("INCOMING"),
      collected,
      contractedOut: sum("OUTGOING"),
      paidOut,
      net: collected - paidOut,
    };
    return ok({ ...project, investorName: investor?.name ?? "", summary });
  };
}
