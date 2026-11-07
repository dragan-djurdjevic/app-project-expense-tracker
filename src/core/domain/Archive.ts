// Spec: BR-GEN-006, BR-GEN-007
import { domainError, type DomainError } from "./DomainError";
import type { Entity } from "./Entity";

export function isArchived(entity: Entity): boolean {
  return entity.archivedAt !== null;
}

/** BR-GEN-007: archived records are read-only except for restore. */
export const archivedReadOnlyError = (): DomainError => domainError("BR-GEN-007", "errors.archivedReadOnly");

/** BR-GEN-006: a new or updated record may not reference an archived parent. */
export const parentArchivedError = (field: string): DomainError =>
  domainError("BR-GEN-006", "errors.parentArchived", field);
