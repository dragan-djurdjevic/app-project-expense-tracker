// Spec: AR-005, BR-GEN-004
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

export type RestoreSubcontractor = (id: string) => Promise<Result<void>>;

/** Clears archivedAt; restoring an active subcontractor changes nothing. */
export function makeRestoreSubcontractor({
  subcontractorRepo,
}: {
  subcontractorRepo: SubcontractorRepository;
}): RestoreSubcontractor {
  return async (id) => {
    const existing = await subcontractorRepo.get(id);
    if (!existing) throw new Error(`Subcontractor not found: ${id}`);
    if (isArchived(existing)) await subcontractorRepo.restore(id);
    return ok(undefined);
  };
}
