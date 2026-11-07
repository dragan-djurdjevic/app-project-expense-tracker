// Spec: AR-004, DM-010
import type { Investor, InvestorFields } from "../../../src/core/domain/Investor";
import type { Clock } from "../../../src/core/ports/Clock";
import type { InvestorListFilter, InvestorRepository } from "../../../src/core/ports/InvestorRepository";

/** Minimal in-memory InvestorRepository for core unit tests (no DB). */
export class InMemoryInvestorRepository implements InvestorRepository {
  readonly rows = new Map<string, Investor>();

  constructor(private readonly clock: Clock) {}

  async list(filter: InvestorListFilter): Promise<Investor[]> {
    return [...this.rows.values()].filter((row) => filter.includeArchived || row.archivedAt === null);
  }

  async get(id: string): Promise<Investor | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: Investor): Promise<Investor> {
    this.rows.set(input.id, input);
    return input;
  }

  async update(id: string, input: InvestorFields & { updatedAt: string }): Promise<Investor> {
    const updated = { ...(this.rows.get(id) as Investor), ...input };
    this.rows.set(id, updated);
    return updated;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    this.rows.set(id, { ...(this.rows.get(id) as Investor), archivedAt: now, updatedAt: now });
  }

  async restore(id: string): Promise<void> {
    this.rows.set(id, {
      ...(this.rows.get(id) as Investor),
      archivedAt: null,
      updatedAt: this.clock.now().toISOString(),
    });
  }

  async existsByVat(vat: string, excludeId?: string): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) => row.vatNumber.toUpperCase() === vat.toUpperCase() && row.id !== excludeId,
    );
  }
}
