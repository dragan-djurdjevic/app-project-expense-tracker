// Spec: AR-005, BR-GEN-004
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

export type ArchiveSubcontractor = (id: string) => Promise<Result<void>>;

/** Sets archivedAt; archiving an archived subcontractor is a no-op success. */
export function makeArchiveSubcontractor({
  subcontractorRepo,
}: {
  subcontractorRepo: SubcontractorRepository;
}): ArchiveSubcontractor {
  return async (id) => {
    const existing = await subcontractorRepo.get(id);
    if (!existing) throw new Error(`Subcontractor not found: ${id}`);
    if (!isArchived(existing)) await subcontractorRepo.archive(id);
    return ok(undefined);
  };
}
