// Spec: AR-005, DM-030, DM-040, DM-050, UI-032
import type { ProjectDetails, ProjectSummary } from "../../domain/Project";
import { ok, type Result } from "../../domain/Result";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { InvoiceRepository } from "../../ports/InvoiceRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";

/** Returns the project with its investor's name and summary cards, or null when no project has this id. */
export type GetProject = (id: string) => Promise<Result<ProjectDetails | null>>;

/**
 * Summary cards (UI-032, all years, net): contracted = Σ INCOMING values, contracted to subcontractors = Σ OUTGOING
 * values; collected = Σ PAID invoice values on INCOMING contracts, paid to subcontractors = Σ PAID invoice values on
 * OUTGOING contracts, net = collected − paid. Archived contracts and archived invoices included.
 */
export function makeGetProject({
  projectRepo,
  investorRepo,
  contractRepo,
  invoiceRepo,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
  contractRepo: ContractRepository;
  invoiceRepo: InvoiceRepository;
}): GetProject {
  return async (id) => {
    const project = await projectRepo.get(id);
    if (!project) return ok(null);
    const [investor, contracts, invoices] = await Promise.all([
      investorRepo.get(project.investorId),
      contractRepo.list({ projectId: id, includeArchived: true }),
      invoiceRepo.list({ projectId: id, status: ["PAID"], includeArchived: true }),
    ]);
    const sum = (type: "INCOMING" | "OUTGOING") =>
      contracts.filter((contract) => contract.type === type).reduce((total, contract) => total + contract.value, 0);
    const paidSum = (direction: "INCOMING" | "OUTGOING") =>
      invoices
        .filter((invoice) => invoice.direction === direction && invoice.status === "PAID")
        .reduce((total, invoice) => total + invoice.value, 0);
    const collected = paidSum("INCOMING");
    const paidOut = paidSum("OUTGOING");
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
