// Spec: AR-004, DM-020, DM-030, DM-040
import type { Contract, ContractFields, ContractListItem } from "../../../src/core/domain/Contract";
import type { Entity } from "../../../src/core/domain/Entity";
import type { Project, ProjectFields } from "../../../src/core/domain/Project";
import type { Subcontractor, SubcontractorFields } from "../../../src/core/domain/Subcontractor";
import type { Clock } from "../../../src/core/ports/Clock";
import type { ContractListFilter, ContractRepository } from "../../../src/core/ports/ContractRepository";
import type { ProjectListFilter, ProjectRepository } from "../../../src/core/ports/ProjectRepository";
import type { SubcontractorListFilter, SubcontractorRepository } from "../../../src/core/ports/SubcontractorRepository";

/** Minimal in-memory entity store for core unit tests (no DB). */
class InMemoryStore<T extends Entity, TFields> {
  readonly rows = new Map<string, T>();

  constructor(protected readonly clock: Clock) {}

  protected all(includeArchived?: boolean): T[] {
    return [...this.rows.values()].filter((row) => includeArchived || row.archivedAt === null);
  }

  async get(id: string): Promise<T | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: T): Promise<T> {
    this.rows.set(input.id, input);
    return input;
  }

  async update(id: string, input: TFields & { updatedAt: string }): Promise<T> {
    const updated = { ...(this.rows.get(id) as T), ...input };
    this.rows.set(id, updated);
    return updated;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    this.rows.set(id, { ...(this.rows.get(id) as T), archivedAt: now, updatedAt: now });
  }

  async restore(id: string): Promise<void> {
    this.rows.set(id, { ...(this.rows.get(id) as T), archivedAt: null, updatedAt: this.clock.now().toISOString() });
  }
}

export class InMemoryProjectRepository extends InMemoryStore<Project, ProjectFields> implements ProjectRepository {
  async list(filter: ProjectListFilter): Promise<Project[]> {
    return this.all(filter.includeArchived);
  }

  async availableYears(): Promise<number[]> {
    return [];
  }
}

export class InMemorySubcontractorRepository
  extends InMemoryStore<Subcontractor, SubcontractorFields>
  implements SubcontractorRepository
{
  async list(filter: SubcontractorListFilter): Promise<Subcontractor[]> {
    return this.all(filter.includeArchived);
  }

  async existsByVat(vat: string, excludeId?: string): Promise<boolean> {
    return [...this.rows.values()].some((row) => row.vatNumber === vat && row.id !== excludeId);
  }
}

export class InMemoryContractRepository extends InMemoryStore<Contract, ContractFields> implements ContractRepository {
  async list(filter: ContractListFilter): Promise<ContractListItem[]> {
    return this.all(filter.includeArchived)
      .filter((row) => filter.projectId === undefined || row.projectId === filter.projectId)
      .map((row) => ({ ...row, projectName: "", counterpartyName: "", invoiced: 0, paid: 0 }));
  }

  async existsByNumber(projectId: string, number: string, excludeId?: string): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) => row.projectId === projectId && row.number.toLowerCase() === number.toLowerCase() && row.id !== excludeId,
    );
  }
}
