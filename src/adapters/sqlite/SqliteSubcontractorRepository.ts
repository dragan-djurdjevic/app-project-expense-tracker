// Spec: AR-004, AR-008, DM-000, DM-020, BR-GEN-004, BR-SUB-001, UI-020, UI-002a, DS-001
import type { Subcontractor, SubcontractorFields } from "../../core/domain/Subcontractor";
import type { Clock } from "../../core/ports/Clock";
import type { SubcontractorListFilter, SubcontractorRepository } from "../../core/ports/SubcontractorRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";
import { searchCondition } from "./sqlSearch";

interface SubcontractorRow {
  id: string;
  name: string;
  vat_number: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

const COLUMNS = "id, name, vat_number, contact_person, email, phone, industry, created_at, updated_at, archived_at";

function toSubcontractor(row: SubcontractorRow): Subcontractor {
  return {
    id: row.id,
    name: row.name,
    vatNumber: row.vat_number,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    industry: row.industry,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteSubcontractorRepository implements SubcontractorRepository {
  constructor(
    private readonly db: SqlDriver,
    private readonly clock: Clock,
  ) {}

  /** Sorted by name (case-insensitive); search over name, VAT number, industry and contact person (UI-020). */
  async list(filter: SubcontractorListFilter): Promise<Subcontractor[]> {
    const where: string[] = [];
    const params: SqlValue[] = [];
    if (!filter.includeArchived) where.push("archived_at IS NULL");
    const search = searchCondition(["name", "vat_number", "industry", "contact_person"], filter.search);
    if (search) {
      where.push(search.sql);
      params.push(...search.params);
    }
    const rows = await this.db.select<SubcontractorRow>(
      `SELECT ${COLUMNS} FROM subcontractor ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY name COLLATE NOCASE, id`,
      params,
    );
    return rows.map(toSubcontractor);
  }

  async get(id: string): Promise<Subcontractor | null> {
    const rows = await this.db.select<SubcontractorRow>(`SELECT ${COLUMNS} FROM subcontractor WHERE id = ?`, [id]);
    return rows[0] ? toSubcontractor(rows[0]) : null;
  }

  async create(input: Subcontractor): Promise<Subcontractor> {
    await this.db.execute(`INSERT INTO subcontractor (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      input.id,
      input.name,
      input.vatNumber,
      input.contactPerson,
      input.email,
      input.phone,
      input.industry,
      input.createdAt,
      input.updatedAt,
      input.archivedAt,
    ]);
    return input;
  }

  async update(id: string, input: SubcontractorFields & { updatedAt: string }): Promise<Subcontractor> {
    await this.db.execute(
      `UPDATE subcontractor SET name = ?, vat_number = ?, contact_person = ?, email = ?, phone = ?, industry = ?,
       updated_at = ? WHERE id = ?`,
      [input.name, input.vatNumber, input.contactPerson, input.email, input.phone, input.industry, input.updatedAt, id],
    );
    const subcontractor = await this.get(id);
    if (!subcontractor) throw new Error(`Subcontractor not found: ${id}`);
    return subcontractor;
  }

  async archive(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE subcontractor SET archived_at = ?, updated_at = ? WHERE id = ?", [now, now, id]);
  }

  async restore(id: string): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.db.execute("UPDATE subcontractor SET archived_at = NULL, updated_at = ? WHERE id = ?", [now, id]);
  }

  /** Case-insensitive, across all subcontractors incl. archived (BR-SUB-001); investors are not considered. */
  async existsByVat(vat: string, excludeId?: string): Promise<boolean> {
    const rows = await this.db.select<{ n: number }>(
      "SELECT COUNT(*) AS n FROM subcontractor WHERE UPPER(vat_number) = UPPER(?) AND id <> ?",
      [vat.trim(), excludeId ?? ""],
    );
    return (rows[0]?.n ?? 0) > 0;
  }
}
