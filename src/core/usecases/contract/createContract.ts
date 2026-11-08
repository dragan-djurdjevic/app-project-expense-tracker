// Spec: AR-005, DM-000, DM-040, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-CON-001, BR-CON-002, BR-CON-003, BR-CON-004, UI-041
import {
  CONTRACT_TYPES,
  contractNumberDuplicateError,
  validateContractInput,
  type Contract,
  type ContractInput,
  type ContractType,
} from "../../domain/Contract";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { ProjectRepository } from "../../ports/ProjectRepository";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";
import { checkProjectReference, checkSubcontractorReference } from "./checkContractReferences";

/** Contract types offered by the form and the type filter (DM-040); the create form defaults to INCOMING (UI-041). */
export const CONTRACT_TYPE_OPTIONS: readonly ContractType[] = CONTRACT_TYPES;
export const CONTRACT_TYPE_DEFAULT: ContractType = "INCOMING";

export type CreateContract = (input: ContractInput) => Promise<Result<Contract>>;

/** Validation order per AR-005: field rules, then references (project, subcontractor), then BR-CON-004. */
export function makeCreateContract({
  contractRepo,
  projectRepo,
  subcontractorRepo,
  clock,
  ids,
}: {
  contractRepo: ContractRepository;
  projectRepo: ProjectRepository;
  subcontractorRepo: SubcontractorRepository;
  clock: Clock;
  ids: IdGenerator;
}): CreateContract {
  return async (input) => {
    const fields = validateContractInput(input);
    if (!fields.ok) return fields;
    const projectError = await checkProjectReference(projectRepo, fields.value.projectId);
    if (projectError) return err(projectError);
    if (fields.value.subcontractorId !== null) {
      const subcontractorError = await checkSubcontractorReference(subcontractorRepo, fields.value.subcontractorId);
      if (subcontractorError) return err(subcontractorError);
    }
    if (await contractRepo.existsByNumber(fields.value.projectId, fields.value.number)) {
      return err(contractNumberDuplicateError());
    }
    const now = clock.now().toISOString();
    const contract: Contract = { id: ids.next(), ...fields.value, createdAt: now, updatedAt: now, archivedAt: null };
    return ok(await contractRepo.create(contract));
  };
}
