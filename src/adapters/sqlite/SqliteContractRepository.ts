// Spec: AR-004, AR-008, DM-000, DM-040, BR-GEN-004, BR-CON-004, UI-040, UI-002a, DS-001, DS-003
import type { Contract, ContractFields, ContractListItem, ContractType } from "../../core/domain/Contract";
import type { Clock } from "../../core/ports/Clock";
import type { ContractListFilter, ContractRepository } from "../../core/ports/ContractRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";
import { searchCondition } from "./sqlSearch";

interface ContractRow {
  id: string;
  number: string;
  type: string;
  project_id: string;
  subcontractor_id: string | null;
  value: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface ContractListRow extends ContractRow {
  project_name: string;
  counterparty_name: string | null;
  invoiced: number;
  paid: number;
}

const COLUMNS =
  "id, number, type, project_id, subcontractor_id, value, date, description, created_at, updated_at, archived_at";
const SELECT_COLUMNS = COLUMNS.split(", ")
  .map((column) => `c.${column}`)
  .join(", ");
/** Counter-party: the project's investor for INCOMING, the subcontractor for OUTGOING (DM-040). */
const COUNTERPARTY = "CASE WHEN c.type = 'INCOMING' THEN i.name ELSE s.name END";

function toContract(row: ContractRow): Contract {
  return {
    id: row.id,
    number: row.number,
    type: row.type as ContractType,
    projectId: row.project_id,
    subcontractorId: row.subcontractor_id,
    value: row.value,
    date: row.date,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteContractRepository implements ContractRepository {
  constructor(
    private readonly db: SqlDriver,
    private readonly clock: Clock,
  ) {}

  /**
   * UI-040: invoiced = Σ non-cancelled invoice values, paid = Σ PAID invoice values (archived invoices included).
   * Sorted by date desc, number asc (case-insensitive), id.
   */
  async list(filter: ContractListFilter): Promise<ContractListItem[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filter.includeArchived) where.push("c.archived_at IS NULL");
    if (filter.projectId !== undefined) {
      where.push("c.project_id = ?");
      params.push(filter.projectId);
    }
    if (filter.type !== undefined) {
      where.push("c.type = ?");
      params.push(filter.type);
    }
    if (filter.subcontractorId !== undefined) {
      where.push("c.subcontractor_id = ?");
      params.push(filter.subcontractorId);
    }
    const search = searchCondition(["c.number", "p.name", COUNTERPARTY, "c.description"], filter.search);
    if (search) {
      where.push(search.sql);
      params.push(...search.params);
    }
    const rows = await this.db.select<ContractListRow>(
      `SELECT ${SELECT_COLUMNS}, p.name AS project_name, ${COUNTERPARTY} AS counterparty_name,
         COALESCE((SELECT SUM(v.value) FROM invoice v WHERE v.contract_id = c.id AND v.status <> 'CANCELLED'), 0)
           AS invoiced,
         COALESCE((SELECT SUM(v.value) FROM invoice v WHERE v.contract_id = c.id AND v.status = 'PAID'), 0) AS paid
       FROM contract c
       JOIN project p ON p.id = c.project_id
       JOIN investor i ON i.id = p.investor_id
       LEFT JOIN subcontractor s ON s.id = c.subcontractor_id
       ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY c.date DESC, c.number COLLATE NOCASE, c.id`,
      params,
    );
    return rows.map((row) => ({
      ...toContract(row),
      projectName: row.project_name,
      counterpartyName: row.counterparty_name ?? "",
      invoiced: row.invoiced,
      paid: row.paid,
    }));
  }

  async get(id: string): Promise<Contract | null> {
    const rows = await this.db.select<ContractRow>(`SELECT ${COLUMNS} FROM contract WHERE id = ?`, [id]);
    return rows[0] ? toContract(rows[0]) : null;
  }

  async create(input: Contract): Promise<Contract> {
    await this.db.execute(`INSERT INTO contract (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.id,
      input.number,
      input.type,
      input.projectId,
      input.subcontractorId,
      input.value,
      input.date,
      input.description,
      input.createdAt,
      input.updatedAt,
      input.archivedAt,
    ]);
    return input;
  }

  /** `type` and `projectId` are immutable (BR-CON-005) and therefore not written. */
  async update(id: string, input: ContractFields & { updatedAt: string }): Promise<Contract> {
    await this.db.execute(
      `UPDATE contract SET number = ?, subcontractor_id = ?, value = ?, date = ?, description = ?, updated_at = ?
       WHERE id = ?`,
      [input.number, input.subcontractorId, input.value, input.date, input.description, input.updatedAt, id],
    );
    const contract = await this.get(id);
    if (!contract) throw new Error(`Contract not found: ${id}`);
    return contract;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE contract SET archived_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  }

  async restore(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE contract SET archived_at = NULL, updated_at = ? WHERE id = ?", [now, id]);
  }

  /** BR-CON-004: `COLLATE NOCASE` like `ux_contract_project_number`; archived contracts included. */
  async existsByNumber(projectId: string, number: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db.select<{ n: number }>(
      "SELECT COUNT(*) AS n FROM contract WHERE project_id = ? AND number = ? COLLATE NOCASE AND id <> ?",
      [projectId, number.trim(), excludeId ?? ""],
    );
    return (rows[0]?.n ?? 0) > 0;
  }
}
