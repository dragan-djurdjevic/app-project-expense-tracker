// Spec: BR-CON-001, BR-CON-002, BR-GEN-006, AR-005
import { isArchived, parentArchivedError } from "../../domain/Archive";
import { projectNotFoundError, subcontractorNotFoundError } from "../../domain/Contract";
import type { DomainError } from "../../domain/DomainError";
import type { ProjectRepository } from "../../ports/ProjectRepository";
import type { SubcontractorRepository } from "../../ports/SubcontractorRepository";

/** BR-CON-001 / BR-GEN-006: the project must exist and be active. Returns null when valid. */
export async function checkProjectReference(
  projectRepo: ProjectRepository,
  projectId: string,
): Promise<DomainError | null> {
  const project = await projectRepo.get(projectId);
  if (!project) return projectNotFoundError();
  if (isArchived(project)) return parentArchivedError("projectId");
  return null;
}

/** BR-CON-002 / BR-GEN-006: the subcontractor must exist and be active. Returns null when valid. */
export async function checkSubcontractorReference(
  subcontractorRepo: SubcontractorRepository,
  subcontractorId: string,
): Promise<DomainError | null> {
  const subcontractor = await subcontractorRepo.get(subcontractorId);
  if (!subcontractor) return subcontractorNotFoundError();
  if (isArchived(subcontractor)) return parentArchivedError("subcontractorId");
  return null;
}
