// Spec: AR-005, UI-020, UI-002a, BR-GEN-004
import { ok, type Result } from "../../domain/Result";
import type { Subcontractor } from "../../domain/Subcontractor";
import type { SubcontractorListFilter, SubcontractorRepository } from "../../ports/SubcontractorRepository";

export type ListSubcontractors = (filter?: SubcontractorListFilter) => Promise<Result<Subcontractor[]>>;

/** Lists subcontractors sorted by name. */
export function makeListSubcontractors({
  subcontractorRepo,
}: {
  subcontractorRepo: SubcontractorRepository;
}): ListSubcontractors {
  return async (filter = {}) => ok(await subcontractorRepo.list(filter));
}
