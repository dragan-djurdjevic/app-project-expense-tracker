// Spec: AR-005, BR-GEN-004, BR-GEN-008
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { ProjectRepository } from "../../ports/ProjectRepository";

export type RestoreProject = (id: string) => Promise<Result<void>>;

/** Clears archivedAt, also when its investor is archived (BR-GEN-008); restoring an active project changes nothing. */
export function makeRestoreProject({ projectRepo }: { projectRepo: ProjectRepository }): RestoreProject {
  return async (id) => {
    const existing = await projectRepo.get(id);
    if (!existing) throw new Error(`Project not found: ${id}`);
    if (isArchived(existing)) await projectRepo.restore(id);
    return ok(undefined);
  };
}
