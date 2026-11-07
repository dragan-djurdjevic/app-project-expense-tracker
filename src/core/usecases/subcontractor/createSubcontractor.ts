// Spec: AR-005, DM-000, DM-020, BR-GEN-002, BR-GEN-003, BR-SUB-001
import {
  subcontractorVatDuplicateError,
  validateSubcontractorInput,
  type Subcontractor,
  type SubcontractorInput,
} from "../../domain/Subcontractor";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

export type CreateSubcontractor = (input: SubcontractorInput) => Promise<Result<Subcontractor>>;

export function makeCreateSubcontractor({
  subcontractorRepo,
  clock,
  ids,
}: {
  subcontractorRepo: SubcontractorRepository;
  clock: Clock;
  ids: IdGenerator;
}): CreateSubcontractor {
  return async (input) => {
    const fields = validateSubcontractorInput(input);
    if (!fields.ok) return fields;
    if (await subcontractorRepo.existsByVat(fields.value.vatNumber)) {
      return err(subcontractorVatDuplicateError());
    }
    const now = clock.now().toISOString();
    const subcontractor: Subcontractor = {
      id: ids.next(),
      ...fields.value,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    return ok(await subcontractorRepo.create(subcontractor));
  };
}
