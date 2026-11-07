// Spec: AR-005, DM-000, DM-020, BR-GEN-002, BR-GEN-003, BR-GEN-007, BR-SUB-001
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import {
  subcontractorVatDuplicateError,
  validateSubcontractorInput,
  type Subcontractor,
  type SubcontractorInput,
} from "../../domain/Subcontractor";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

export type UpdateSubcontractor = (id: string, input: SubcontractorInput) => Promise<Result<Subcontractor>>;

export function makeUpdateSubcontractor({
  subcontractorRepo,
  clock,
}: {
  subcontractorRepo: SubcontractorRepository;
  clock: Clock;
}): UpdateSubcontractor {
  return async (id, input) => {
    const existing = await subcontractorRepo.get(id);
    if (!existing) throw new Error(`Subcontractor not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    const fields = validateSubcontractorInput(input);
    if (!fields.ok) return fields;
    if (await subcontractorRepo.existsByVat(fields.value.vatNumber, id)) {
      return err(subcontractorVatDuplicateError());
    }
    return ok(await subcontractorRepo.update(id, { ...fields.value, updatedAt: clock.now().toISOString() }));
  };
}
