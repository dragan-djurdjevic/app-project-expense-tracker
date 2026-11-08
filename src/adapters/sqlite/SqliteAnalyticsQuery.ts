// Spec: AR-003, AR-004, AN-000, AN-1, AN-2, AN-3, AN-4, AN-5, DS-005, DM-050
import type {
  AnalyticsMode,
  BudgetRealisationRow,
  ContractedVsCollectedRow,
  NetPerProjectRow,
  ProjectInYearRow,
  SubcontractorPaymentRow,
  SubcontractorPaymentSubRow,
  YearSelection,
} from "../../core/domain/Analytics";
import type { ProjectStatus } from "../../core/domain/Project";
import type { AnalyticsQuery } from "../../core/ports/AnalyticsQuery";
import type { ProjectRepository } from "../../core/ports/ProjectRepository";
import type { SqlDriver, SqlValue } from "./SqlDriver";

interface Fragment {
  sql: string;
  params: SqlValue[];
}

interface ProjectAmountsRow {
  id: string;
  name: string;
  archived_at: string | null;
  investor_name: string;
  status: string;
  deadline: string | null;
  budget: number | null;
  contracted: number;
  incoming_count: number;
  collected: number;
  contracted_out: number;
  paid_out: number;
}

interface SubRow {
  project_id: string;
  subcontractor_id: string;
  subcontractor_name: string;
  contracted_out: number;
  paid_out: number;
}

interface BudgetRow {
  id: string;
  name: string;
  archived_at: string | null;
  investor_name: string;
  status: string;
  budget: number | null;
  contracted: number;
  invoiced: number;
  collected: number;
}

/** DS-005 year predicate on a date column; "ALL" = no restriction. */
function yearIs(column: string, year: YearSelection): Fragment {
  return year === "ALL"
    ? { sql: "1 = 1", params: [] }
    : { sql: `CAST(substr(${column}, 1, 4) AS INTEGER) = ?`, params: [year] };
}

/** AN-000: Net = value; Gross = value + round_half_up(value × vat_rate / 10000) (values and rates are ≥ 0). */
function amount(mode: AnalyticsMode): string {
  return mode === "NET" ? "i.value" : "(i.value + (i.value * i.vat_rate + 5000) / 10000)";
}

/**
 * Per-project CTEs for year Y (archived records included, AN-000a; only PAID invoices count, AN-000b):
 * `inc` contractedIn + count, `col` collected, `outc` contractedOut + count, `paid` paidOut.
 */
function perProjectCtes(year: YearSelection, mode: AnalyticsMode): Fragment {
  const contractYear = yearIs("c.date", year);
  const invoiceYear = yearIs("i.date", year);
  const contracts = (type: string, alias: string) =>
    `${alias} AS (SELECT c.project_id, SUM(c.value) AS total, COUNT(*) AS n FROM contract c
      WHERE c.type = '${type}' AND ${contractYear.sql} GROUP BY c.project_id)`;
  const payments = (type: string, alias: string) =>
    `${alias} AS (SELECT c.project_id, SUM(${amount(mode)}) AS total FROM invoice i
      JOIN contract c ON c.id = i.contract_id
      WHERE c.type = '${type}' AND i.status = 'PAID' AND ${invoiceYear.sql}
      GROUP BY c.project_id HAVING SUM(i.value) > 0)`;
  return {
    sql: `WITH ${contracts("INCOMING", "inc")}, ${payments("INCOMING", "col")},
      ${contracts("OUTGOING", "outc")}, ${payments("OUTGOING", "paid")}`,
    params: [...contractYear.params, ...invoiceYear.params, ...contractYear.params, ...invoiceYear.params],
  };
}

const PROJECT_AMOUNTS_SELECT = `SELECT p.id, p.name, p.archived_at, inv.name AS investor_name, p.status, p.deadline,
    p.budget, COALESCE(inc.total, 0) AS contracted, COALESCE(inc.n, 0) AS incoming_count,
    COALESCE(col.total, 0) AS collected, COALESCE(outc.total, 0) AS contracted_out, COALESCE(paid.total, 0) AS paid_out
  FROM project p JOIN investor inv ON inv.id = p.investor_id
  LEFT JOIN inc ON inc.project_id = p.id LEFT JOIN col ON col.project_id = p.id
  LEFT JOIN outc ON outc.project_id = p.id LEFT JOIN paid ON paid.project_id = p.id`;

/** AN-000f: rows sorted by project name asc. */
const ORDER_BY_NAME = "ORDER BY p.name COLLATE NOCASE, p.id";

/** AN-1 row condition: an INCOMING contract dated in Y (any value) or collected > 0. */
const AN1_ROW = "(inc.n IS NOT NULL OR col.total IS NOT NULL)";
/** AN-2 / AN-4 row condition: AN-1 row, or an OUTGOING contract dated in Y, or paidOut > 0. */
const AN2_ROW = `(${AN1_ROW} OR outc.n IS NOT NULL OR paid.total IS NOT NULL)`;

const base = (row: { id: string; name: string; archived_at: string | null }) => ({
  projectId: row.id,
  projectName: row.name,
  projectArchived: row.archived_at !== null,
});

/** Analytics aggregated in SQL over the same tables as the repositories (AR-003). */
export class SqliteAnalyticsQuery implements AnalyticsQuery {
  constructor(
    private readonly db: SqlDriver,
    private readonly projectRepo: ProjectRepository,
  ) {}

  private async projectAmounts(year: YearSelection, mode: AnalyticsMode, condition: string) {
    const ctes = perProjectCtes(year, mode);
    return this.db.select<ProjectAmountsRow>(
      `${ctes.sql} ${PROJECT_AMOUNTS_SELECT} WHERE ${condition} ${ORDER_BY_NAME}`,
      ctes.params,
    );
  }

  /** AN-1. */
  async contractedVsCollected(year: YearSelection, mode: AnalyticsMode): Promise<ContractedVsCollectedRow[]> {
    const rows = await this.projectAmounts(year, mode, AN1_ROW);
    return rows.map((row) => ({
      ...base(row),
      investorName: row.investor_name,
      contracted: row.contracted,
      collected: row.collected,
      contractedInYear: row.incoming_count > 0,
    }));
  }

  /** AN-2; sub-rows = subcontractors with an OUTGOING contract dated in Y or a payment in Y, sorted by name. */
  async subcontractorPayments(year: YearSelection, mode: AnalyticsMode): Promise<SubcontractorPaymentRow[]> {
    const rows = await this.projectAmounts(year, mode, AN2_ROW);
    const contractYear = yearIs("c.date", year);
    const invoiceYear = yearIs("i.date", year);
    const subRows = await this.db.select<SubRow>(
      `WITH outc AS (SELECT c.project_id, c.subcontractor_id, SUM(c.value) AS total FROM contract c
          WHERE c.type = 'OUTGOING' AND ${contractYear.sql} GROUP BY c.project_id, c.subcontractor_id),
        paid AS (SELECT c.project_id, c.subcontractor_id, SUM(${amount(mode)}) AS total FROM invoice i
          JOIN contract c ON c.id = i.contract_id
          WHERE c.type = 'OUTGOING' AND i.status = 'PAID' AND ${invoiceYear.sql}
          GROUP BY c.project_id, c.subcontractor_id HAVING SUM(i.value) > 0),
        keys AS (SELECT project_id, subcontractor_id FROM outc UNION SELECT project_id, subcontractor_id FROM paid)
       SELECT k.project_id, s.id AS subcontractor_id, s.name AS subcontractor_name,
         COALESCE(outc.total, 0) AS contracted_out, COALESCE(paid.total, 0) AS paid_out
       FROM keys k JOIN subcontractor s ON s.id = k.subcontractor_id
       LEFT JOIN outc ON outc.project_id = k.project_id AND outc.subcontractor_id = k.subcontractor_id
       LEFT JOIN paid ON paid.project_id = k.project_id AND paid.subcontractor_id = k.subcontractor_id
       ORDER BY s.name COLLATE NOCASE, s.id`,
      [...contractYear.params, ...invoiceYear.params],
    );
    const byProject = new Map<string, SubcontractorPaymentSubRow[]>();
    for (const sub of subRows) {
      const list = byProject.get(sub.project_id) ?? [];
      list.push({
        subcontractorId: sub.subcontractor_id,
        subcontractorName: sub.subcontractor_name,
        contractedOut: sub.contracted_out,
        paidOut: sub.paid_out,
      });
      byProject.set(sub.project_id, list);
    }
    return rows.map((row) => ({
      ...base(row),
      contractedOut: row.contracted_out,
      paidOut: row.paid_out,
      collected: row.collected,
      subcontractors: byProject.get(row.id) ?? [],
    }));
  }

  /** AN-3: deadline in Y or any contract (any type, incl. archived) dated in Y. */
  async projectsInYear(year: number): Promise<ProjectInYearRow[]> {
    const deadlineYear = yearIs("p.deadline", year);
    const contractYear = yearIs("c.date", year);
    const ctes = perProjectCtes(year, "NET");
    const rows = await this.db.select<ProjectAmountsRow>(
      `${ctes.sql} ${PROJECT_AMOUNTS_SELECT}
       WHERE ${deadlineYear.sql}
         OR EXISTS (SELECT 1 FROM contract c WHERE c.project_id = p.id AND ${contractYear.sql})
       ${ORDER_BY_NAME}`,
      [...ctes.params, ...deadlineYear.params, ...contractYear.params],
    );
    return rows.map((row) => ({
      ...base(row),
      investorName: row.investor_name,
      status: row.status as ProjectStatus,
      deadline: row.deadline,
      budget: row.budget,
      contractedInYear: row.contracted,
    }));
  }

  /** AN-4: union of AN-1 and AN-2 rows. */
  async netPerProject(year: YearSelection, mode: AnalyticsMode): Promise<NetPerProjectRow[]> {
    const rows = await this.projectAmounts(year, mode, AN2_ROW);
    return rows.map((row) => ({ ...base(row), collected: row.collected, paidOut: row.paid_out }));
  }

  /** AN-5: all projects (optionally filtered by status), all dates, net values. */
  async budgetRealisation(statuses: ProjectStatus[]): Promise<BudgetRealisationRow[]> {
    const where = statuses.length > 0 ? `WHERE p.status IN (${statuses.map(() => "?").join(", ")})` : "";
    const incomingInvoices = (statusList: string) =>
      `COALESCE((SELECT SUM(i.value) FROM invoice i JOIN contract c ON c.id = i.contract_id
        WHERE c.project_id = p.id AND c.type = 'INCOMING' AND i.status IN (${statusList})), 0)`;
    const rows = await this.db.select<BudgetRow>(
      `SELECT p.id, p.name, p.archived_at, inv.name AS investor_name, p.status, p.budget,
         COALESCE((SELECT SUM(c.value) FROM contract c WHERE c.project_id = p.id AND c.type = 'INCOMING'), 0)
           AS contracted,
         ${incomingInvoices("'ISSUED', 'PAID'")} AS invoiced,
         ${incomingInvoices("'PAID'")} AS collected
       FROM project p JOIN investor inv ON inv.id = p.investor_id
       ${where} ${ORDER_BY_NAME}`,
      statuses,
    );
    return rows.map((row) => ({
      ...base(row),
      investorName: row.investor_name,
      status: row.status as ProjectStatus,
      budget: row.budget,
      contracted: row.contracted,
      invoiced: row.invoiced,
      collected: row.collected,
    }));
  }

  /** AN-000h: reuses the project repository's `availableYears()` (AR-004). */
  async availableYears(): Promise<number[]> {
    return this.projectRepo.availableYears();
  }
}
