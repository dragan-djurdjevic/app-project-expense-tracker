// Spec: AR-004, AR-008, DM-000, DM-030, BR-GEN-004, UI-030, UI-002a, AN-3, AN-000, DS-001, DS-005
import type { Project, ProjectFields, ProjectStatus } from "../../core/domain/Project";
import type { Clock } from "../../core/ports/Clock";
import type { ProjectListFilter, ProjectRepository } from "../../core/ports/ProjectRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";
import { searchCondition } from "./sqlSearch";

interface ProjectRow {
  id: string;
  name: string;
  deadline: string | null;
  status: string;
  budget: number | null;
  investor_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

const COLUMNS = "id, name, deadline, status, budget, investor_id, created_at, updated_at, archived_at";
const SELECT_COLUMNS = COLUMNS.split(", ")
  .map((column) => `p.${column}`)
  .join(", ");

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    deadline: row.deadline,
    status: row.status as ProjectStatus,
    budget: row.budget,
    investorId: row.investor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteProjectRepository implements ProjectRepository {
  constructor(
    private readonly db: SqlDriver,
    private readonly clock: Clock,
  ) {}

  /**
   * Sorted by deadline asc (nulls last), then name. Search over project name and investor name (UI-030).
   * Year filter = AN-3: deadline in the year or any contract (any type, incl. archived) dated in the year.
   */
  async list(filter: ProjectListFilter): Promise<Project[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filter.includeArchived) where.push("p.archived_at IS NULL");
    if (filter.investorId !== undefined) {
      where.push("p.investor_id = ?");
      params.push(filter.investorId);
    }
    if (filter.status !== undefined && filter.status.length > 0) {
      where.push(`p.status IN (${filter.status.map(() => "?").join(", ")})`);
      params.push(...filter.status);
    }
    if (filter.year !== undefined) {
      where.push(
        `(CAST(substr(p.deadline, 1, 4) AS INTEGER) = ?
          OR EXISTS (SELECT 1 FROM contract c WHERE c.project_id = p.id AND CAST(substr(c.date, 1, 4) AS INTEGER) = ?))`,
      );
      params.push(filter.year, filter.year);
    }
    const search = searchCondition(["p.name", "i.name"], filter.search);
    if (search) {
      where.push(search.sql);
      params.push(...search.params);
    }
    const rows = await this.db.select<ProjectRow>(
      `SELECT ${SELECT_COLUMNS} FROM project p JOIN investor i ON i.id = p.investor_id
       ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY p.deadline IS NULL, p.deadline, p.name COLLATE NOCASE, p.id`,
      params,
    );
    return rows.map(toProject);
  }

  async get(id: string): Promise<Project | null> {
    const rows = await this.db.select<ProjectRow>(`SELECT ${COLUMNS} FROM project WHERE id = ?`, [id]);
    return rows[0] ? toProject(rows[0]) : null;
  }

  async create(input: Project): Promise<Project> {
    await this.db.execute(`INSERT INTO project (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.id,
      input.name,
      input.deadline,
      input.status,
      input.budget,
      input.investorId,
      input.createdAt,
      input.updatedAt,
      input.archivedAt,
    ]);
    return input;
  }

  async update(id: string, input: ProjectFields & { updatedAt: string }): Promise<Project> {
    await this.db.execute(
      `UPDATE project SET name = ?, deadline = ?, status = ?, budget = ?, investor_id = ?, updated_at = ?
       WHERE id = ?`,
      [input.name, input.deadline, input.status, input.budget, input.investorId, input.updatedAt, id],
    );
    const project = await this.get(id);
    if (!project) throw new Error(`Project not found: ${id}`);
    return project;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE project SET archived_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  }

  async restore(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE project SET archived_at = NULL, updated_at = ? WHERE id = ?", [now, id]);
  }

  /** AN-000h: distinct years of contract.date, invoice.date and project.deadline (DS-005), descending. */
  async availableYears(): Promise<number[]> {
    const rows = await this.db.select<{ year: number }>(
      `SELECT DISTINCT year FROM (
         SELECT CAST(substr(date, 1, 4) AS INTEGER) AS year FROM contract
         UNION SELECT CAST(substr(date, 1, 4) AS INTEGER) FROM invoice
         UNION SELECT CAST(substr(deadline, 1, 4) AS INTEGER) FROM project WHERE deadline IS NOT NULL
       ) ORDER BY year DESC`,
    );
    return rows.map((row) => row.year);
  }
}
