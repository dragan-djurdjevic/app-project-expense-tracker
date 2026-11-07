// Spec: AR-005, BR-GEN-004, BR-GEN-005
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { ProjectRepository } from "../../ports/ProjectRepository";

export type ArchiveProject = (id: string) => Promise<Result<void>>;

/** Sets archivedAt; archiving an archived project is a no-op success. Its contracts are not archived (BR-GEN-005). */
export function makeArchiveProject({ projectRepo }: { projectRepo: ProjectRepository }): ArchiveProject {
  return async (id) => {
    const existing = await projectRepo.get(id);
    if (!existing) throw new Error(`Project not found: ${id}`);
    if (!isArchived(existing)) await projectRepo.archive(id);
    return ok(undefined);
  };
}
