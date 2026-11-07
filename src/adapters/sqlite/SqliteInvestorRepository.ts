// Spec: AR-004, AR-008, DM-000, DM-010, BR-GEN-004, BR-INV-001, UI-010, UI-002a, DS-001
import type { Investor, InvestorFields } from "../../core/domain/Investor";
import type { Clock } from "../../core/ports/Clock";
import type { InvestorListFilter, InvestorRepository } from "../../core/ports/InvestorRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";
import { searchCondition } from "./sqlSearch";

interface InvestorRow {
  id: string;
  name: string;
  vat_number: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

const COLUMNS = "id, name, vat_number, contact_person, email, phone, created_at, updated_at, archived_at";

function toInvestor(row: InvestorRow): Investor {
  return {
    id: row.id,
    name: row.name,
    vatNumber: row.vat_number,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteInvestorRepository implements InvestorRepository {
  constructor(
    private readonly db: SqlDriver,
    private readonly clock: Clock,
  ) {}

  /** Sorted by name (case-insensitive); search over name, VAT number and contact person (UI-010). */
  async list(filter: InvestorListFilter): Promise<Investor[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filter.includeArchived) where.push("archived_at IS NULL");
    const search = searchCondition(["name", "vat_number", "contact_person"], filter.search);
    if (search) {
      where.push(search.sql);
      params.push(...search.params);
    }
    const rows = await this.db.select<InvestorRow>(
      `SELECT ${COLUMNS} FROM investor ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY name COLLATE NOCASE, id`,
      params,
    );
    return rows.map(toInvestor);
  }

  async get(id: string): Promise<Investor | null> {
    const rows = await this.db.select<InvestorRow>(`SELECT ${COLUMNS} FROM investor WHERE id = ?`, [id]);
    return rows[0] ? toInvestor(rows[0]) : null;
  }

  async create(input: Investor): Promise<Investor> {
    await this.db.execute(`INSERT INTO investor (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.id,
      input.name,
      input.vatNumber,
      input.contactPerson,
      input.email,
      input.phone,
      input.createdAt,
      input.updatedAt,
      input.archivedAt,
    ]);
    return input;
  }

  async update(id: string, input: InvestorFields & { updatedAt: string }): Promise<Investor> {
    await this.db.execute(
      `UPDATE investor SET name = ?, vat_number = ?, contact_person = ?, email = ?, phone = ?, updated_at = ?
       WHERE id = ?`,
      [input.name, input.vatNumber, input.contactPerson, input.email, input.phone, input.updatedAt, id],
    );
    return this.require(id);
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE investor SET archived_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  }

  async restore(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE investor SET archived_at = NULL, updated_at = ? WHERE id = ?", [now, id]);
  }

  /** Case-insensitive, across all investors incl. archived (BR-INV-001). */
  async existsByVat(vat: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db.select<{ n: number }>(
      "SELECT COUNT(*) AS n FROM investor WHERE UPPER(vat_number) = UPPER(?) AND id <> ?",
      [vat.trim(), excludeId ?? ""],
    );
    return (rows[0]?.n ?? 0) > 0;
  }

  private async require(id: string): Promise<Investor> {
    const investor = await this.get(id);
    if (!investor) throw new Error(`Investor not found: ${id}`);
    return investor;
  }
}
