// Spec: AR-005, DM-000, DM-030, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-PRJ-001, UI-031
import {
  DEFAULT_PROJECT_STATUS,
  PROJECT_STATUSES,
  validateProjectInput,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from "../../domain/Project";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";
import { checkInvestorReference } from "./checkInvestorReference";

/** Status values offered by the project form and the status filter (DM-030). */
export const PROJECT_STATUS_OPTIONS: readonly ProjectStatus[] = PROJECT_STATUSES;
export const PROJECT_STATUS_DEFAULT: ProjectStatus = DEFAULT_PROJECT_STATUS;

export type CreateProject = (input: ProjectInput) => Promise<Result<Project>>;

export function makeCreateProject({
  projectRepo,
  investorRepo,
  clock,
  ids,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
  clock: Clock;
  ids: IdGenerator;
}): CreateProject {
  return async (input) => {
    const fields = validateProjectInput(input);
    if (!fields.ok) return fields;
    const referenceError = await checkInvestorReference(investorRepo, fields.value.investorId);
    if (referenceError) return err(referenceError);
    const now = clock.now().toISOString();
    const project: Project = { id: ids.next(), ...fields.value, createdAt: now, updatedAt: now, archivedAt: null };
    return ok(await projectRepo.create(project));
  };
}
