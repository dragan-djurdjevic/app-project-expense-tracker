// Spec: AR-005, DM-020
import type { Subcontractor } from "../../domain/Subcontractor";
import { ok, type Result } from "../../domain/Result";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

/** Returns the subcontractor, or null when no subcontractor has this id. */
export type GetSubcontractor = (id: string) => Promise<Result<Subcontractor | null>>;

export function makeGetSubcontractor({
  subcontractorRepo,
}: {
  subcontractorRepo: SubcontractorRepository;
}): GetSubcontractor {
  return async (id) => ok(await subcontractorRepo.get(id));
}
