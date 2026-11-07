// Spec: AR-003, AR-004, DM-000
import type { Entity } from "../domain/Entity";

/** Common list filter: archived records are excluded unless `includeArchived` is true. */
export interface BaseListFilter {
  includeArchived?: boolean;
  search?: string;
}

/**
 * Shape shared by all entity repositories (AR-004). `create` receives the complete new entity (id and
 * timestamps set by the use case from IdGenerator/Clock); `update` receives the changed fields and `updatedAt`.
 */
export interface EntityRepository<T extends Entity, TFields, TFilter extends BaseListFilter> {
  list(filter: TFilter): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(input: T): Promise<T>;
  update(id: string, input: TFields & { updatedAt: string }): Promise<T>;
  /** Sets `archivedAt` and `updatedAt` (BR-GEN-004); the implementation takes the timestamp from a Clock. */
  archive(id: string): Promise<void>;
  /** Clears `archivedAt` and sets `updatedAt` (BR-GEN-004). */
  restore(id: string): Promise<void>;
}
