// Spec: AR-005, DM-000, DM-040, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-GEN-006, BR-GEN-007, BR-CON-002, BR-CON-003, BR-CON-004, BR-CON-005
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import {
  contractImmutableError,
  contractNumberDuplicateError,
  validateContractInput,
  type Contract,
  type ContractInput,
} from "../../domain/Contract";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { ContractRepository } from "../../ports/ContractRepository";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";
import { checkSubcontractorReference } from "./checkContractReferences";

export type UpdateContract = (id: string, input: ContractInput) => Promise<Result<Contract>>;

/**
 * Order per AR-005: BR-GEN-007, BR-CON-005 (type, then projectId), field rules, subcontractor reference (only when it
 * changes — existing references to a parent archived later stay valid, BR-GEN-006), BR-CON-004.
 */
export function makeUpdateContract({
  contractRepo,
  subcontractorRepo,
  clock,
}: {
  contractRepo: ContractRepository;
  subcontractorRepo: SubcontractorRepository;
  clock: Clock;
}): UpdateContract {
  return async (id, input) => {
    const existing = await contractRepo.get(id);
    if (!existing) throw new Error(`Contract not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    if ((input.type ?? "").trim() !== existing.type) return err(contractImmutableError("type"));
    if ((input.projectId ?? "").trim() !== existing.projectId) return err(contractImmutableError("projectId"));
    const fields = validateContractInput(input);
    if (!fields.ok) return fields;
    const { subcontractorId } = fields.value;
    if (subcontractorId !== null && subcontractorId !== existing.subcontractorId) {
      const subcontractorError = await checkSubcontractorReference(subcontractorRepo, subcontractorId);
      if (subcontractorError) return err(subcontractorError);
    }
    if (await contractRepo.existsByNumber(existing.projectId, fields.value.number, id)) {
      return err(contractNumberDuplicateError());
    }
    return ok(await contractRepo.update(id, { ...fields.value, updatedAt: clock.now().toISOString() }));
  };
}
