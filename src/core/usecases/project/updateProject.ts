// Spec: AR-005, DM-000, DM-030, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-GEN-007, BR-PRJ-001
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import { validateProjectInput, type Project, type ProjectInput } from "../../domain/Project";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { InvestorRepository } from "../../ports/InvestorRepository";
import type { ProjectRepository } from "../../ports/ProjectRepository";
import { checkInvestorReference } from "./checkInvestorReference";

export type UpdateProject = (id: string, input: ProjectInput) => Promise<Result<Project>>;

/**
 * Any status may change to any other (DM-030). The investor reference is checked only when it changes: an existing
 * reference to an investor archived later stays valid (BR-GEN-006).
 */
export function makeUpdateProject({
  projectRepo,
  investorRepo,
  clock,
}: {
  projectRepo: ProjectRepository;
  investorRepo: InvestorRepository;
  clock: Clock;
}): UpdateProject {
  return async (id, input) => {
    const existing = await projectRepo.get(id);
    if (!existing) throw new Error(`Project not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    const fields = validateProjectInput(input);
    if (!fields.ok) return fields;
    if (fields.value.investorId !== existing.investorId) {
      const referenceError = await checkInvestorReference(investorRepo, fields.value.investorId);
      if (referenceError) return err(referenceError);
    }
    return ok(await projectRepo.update(id, { ...fields.value, updatedAt: clock.now().toISOString() }));
  };
}
