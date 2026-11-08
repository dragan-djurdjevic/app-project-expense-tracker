// Spec: AR-004, AR-008, DM-000, DM-050, BR-GEN-004, BR-IVC-003, UI-050, UI-002a, DS-001, DS-003, DS-004
import type { ContractType } from "../../core/domain/Contract";
import {
  computeInvoiceAmounts,
  type Invoice,
  type InvoiceFields,
  type InvoiceListItem,
  type InvoiceStatus,
} from "../../core/domain/Invoice";
import type { Clock } from "../../core/ports/Clock";
import type { InvoiceListFilter, InvoiceRepository } from "../../core/ports/InvoiceRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";
import { searchCondition } from "./sqlSearch";

interface InvoiceRow {
  id: string;
  number: string;
  contract_id: string;
  value: number;
  vat_rate: number;
  date: string;
  due_date: string | null;
  status: string;
  description: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface InvoiceListRow extends InvoiceRow {
  contract_number: string;
  contract_type: string;
  project_id: string;
  project_name: string;
}

const COLUMNS =
  "id, number, contract_id, value, vat_rate, date, due_date, status, description, attachment_path, attachment_name, " +
  "created_at, updated_at, archived_at";
const SELECT_COLUMNS = COLUMNS.split(", ")
  .map((column) => `v.${column}`)
  .join(", ");

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    number: row.number,
    contractId: row.contract_id,
    value: row.value,
    vatRate: row.vat_rate,
    date: row.date,
    dueDate: row.due_date,
    status: row.status as InvoiceStatus,
    description: row.description,
    attachment:
      row.attachment_path !== null && row.attachment_name !== null
        ? { path: row.attachment_path, originalName: row.attachment_name }
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteInvoiceRepository implements InvoiceRepository {
  constructor(
    private readonly db: SqlDriver,
    private readonly clock: Clock,
  ) {}

  /** UI-050: joined contract number, type (direction) and project; sorted by date desc, number asc, id. */
  async list(filter: InvoiceListFilter): Promise<InvoiceListItem[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filter.includeArchived) where.push("v.archived_at IS NULL");
    if (filter.contractId !== undefined) {
      where.push("v.contract_id = ?");
      params.push(filter.contractId);
    }
    if (filter.projectId !== undefined) {
      where.push("c.project_id = ?");
      params.push(filter.projectId);
    }
    if (filter.status !== undefined && filter.status.length > 0) {
      where.push(`v.status IN (${filter.status.map(() => "?").join(", ")})`);
      params.push(...filter.status);
    }
    if (filter.direction !== undefined) {
      where.push("c.type = ?");
      params.push(filter.direction);
    }
    const search = searchCondition(["v.number", "c.number", "p.name", "v.description"], filter.search);
    if (search) {
      where.push(search.sql);
      params.push(...search.params);
    }
    const rows = await this.db.select<InvoiceListRow>(
      `SELECT ${SELECT_COLUMNS}, c.number AS contract_number, c.type AS contract_type, c.project_id AS project_id,
         p.name AS project_name
       FROM invoice v
       JOIN contract c ON c.id = v.contract_id
       JOIN project p ON p.id = c.project_id
       ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY v.date DESC, v.number COLLATE NOCASE, v.id`,
      params,
    );
    return rows.map((row) => ({
      ...toInvoice(row),
      contractNumber: row.contract_number,
      projectId: row.project_id,
      projectName: row.project_name,
      direction: row.contract_type as ContractType,
      ...computeInvoiceAmounts(row.value, row.vat_rate),
    }));
  }

  async get(id: string): Promise<Invoice | null> {
    const rows = await this.db.select<InvoiceRow>(`SELECT ${COLUMNS} FROM invoice WHERE id = ?`, [id]);
    return rows[0] ? toInvoice(rows[0]) : null;
  }

  async create(input: Invoice): Promise<Invoice> {
    await this.db.execute(`INSERT INTO invoice (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.id,
      input.number,
      input.contractId,
      input.value,
      input.vatRate,
      input.date,
      input.dueDate,
      input.status,
      input.description,
      input.attachment?.path ?? null,
      input.attachment?.originalName ?? null,
      input.createdAt,
      input.updatedAt,
      input.archivedAt,
    ]);
    return input;
  }

  /** `contractId` is immutable (BR-IVC-002) and therefore not written. */
  async update(id: string, input: InvoiceFields & { updatedAt: string }): Promise<Invoice> {
    await this.db.execute(
      `UPDATE invoice SET number = ?, value = ?, vat_rate = ?, date = ?, due_date = ?, status = ?, description = ?,
         attachment_path = ?, attachment_name = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.number,
        input.value,
        input.vatRate,
        input.date,
        input.dueDate,
        input.status,
        input.description,
        input.attachment?.path ?? null,
        input.attachment?.originalName ?? null,
        input.updatedAt,
        id,
      ],
    );
    const invoice = await this.get(id);
    if (!invoice) throw new Error(`Invoice not found: ${id}`);
    return invoice;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE invoice SET archived_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  }

  async restore(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE invoice SET archived_at = NULL, updated_at = ? WHERE id = ?", [now, id]);
  }

  /** BR-IVC-003: `COLLATE NOCASE` like `ux_invoice_contract_number`; archived invoices included. */
  async existsByNumber(contractId: string, number: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db.select<{ n: number }>(
      "SELECT COUNT(*) AS n FROM invoice WHERE contract_id = ? AND number = ? COLLATE NOCASE AND id <> ?",
      [contractId, number.trim(), excludeId ?? ""],
    );
    return (rows[0]?.n ?? 0) > 0;
  }
}
