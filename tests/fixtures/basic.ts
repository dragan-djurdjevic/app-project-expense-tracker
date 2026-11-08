// Spec: AR-009, DM-010, DM-020, DM-030, DM-040, DM-050, DS-004
import type { SqlDriver } from "../../src/adapters/sqlite/SqlDriver";
import type { DocumentStorage } from "../../src/core/ports/DocumentStorage";

const TS = "2026-01-01T00:00:00.000Z";

/** Stable ids of the `basic` fixture rows. */
export const BASIC = {
  investors: {
    alpha: "10000000-0000-4000-8000-000000000001",
    beta: "10000000-0000-4000-8000-000000000002",
  },
  subcontractors: {
    struct: "20000000-0000-4000-8000-000000000001",
    hvac: "20000000-0000-4000-8000-000000000002",
  },
  projects: {
    villa: "30000000-0000-4000-8000-000000000001",
    tower: "30000000-0000-4000-8000-000000000002",
    /** Archived. */
    school: "30000000-0000-4000-8000-000000000003",
  },
  /** Office Tower has no contracts (keeps TC-M2-036 valid). */
  contracts: {
    villaIn: "40000000-0000-4000-8000-000000000001",
    villaOut: "40000000-0000-4000-8000-000000000002",
    schoolIn: "40000000-0000-4000-8000-000000000003",
    schoolOut: "40000000-0000-4000-8000-000000000004",
  },
  /** Villa Lake only (Office Tower has none, keeps TC-M2-036 valid); all dates in 2025 (keeps TC-M2-034 valid). */
  invoices: {
    /** INV-001 on V-001, PAID, with attachment `sample.pdf`. */
    inv001: "50000000-0000-4000-8000-000000000001",
    /** INV-002 on V-001, ISSUED, overdue. */
    inv002: "50000000-0000-4000-8000-000000000002",
    /** INV-003 on V-001, DRAFT. */
    inv003: "50000000-0000-4000-8000-000000000003",
    /** INV-004 on V-001, CANCELLED. */
    inv004: "50000000-0000-4000-8000-000000000004",
    /** SI-001 on V-OUT-1, PAID. */
    si001: "50000000-0000-4000-8000-000000000005",
  },
} as const;

/**
 * Fixture "basic": 2 investors, 2 subcontractors, 3 projects (1 archived) (M2) and 4 active contracts on Villa Lake
 * and the archived School Annex (M3), 5 invoices on Villa Lake covering all statuses, one with an attachment (M4).
 */
export async function basicFixture(db: SqlDriver, documents: DocumentStorage): Promise<void> {
  // Loaded lazily: the Playwright runner imports BASIC from this module in Node, where `?raw` is unavailable.
  const { default: samplePdf } = await import("./files/sample.pdf?raw");
  const attachment = await documents.save(new TextEncoder().encode(samplePdf), "sample.pdf", BASIC.invoices.inv001);
  await db.transaction(async (tx) => {
    const investor = (id: string, name: string, vat: string, contact: string | null, email: string | null) =>
      tx.execute(
        `INSERT INTO investor (id, name, vat_number, contact_person, email, phone, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
        [id, name, vat, contact, email, TS, TS],
      );
    await investor(BASIC.investors.alpha, "Alpha Invest", "ALPHA001", "Ana Alpha", "ana@alpha.example");
    await investor(BASIC.investors.beta, "Beta Holding", "BETA001", null, null);

    const subcontractor = (id: string, name: string, vat: string, industry: string) =>
      tx.execute(
        `INSERT INTO subcontractor (id, name, vat_number, industry, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [id, name, vat, industry, TS, TS],
      );
    await subcontractor(BASIC.subcontractors.struct, "Struct Eng", "STRUCT01", "Structural engineering");
    await subcontractor(BASIC.subcontractors.hvac, "HVAC Pro", "HVAC01", "HVAC");

    const project = (
      id: string,
      name: string,
      investorId: string,
      deadline: string,
      status: string,
      budget: number,
      archivedAt: string | null,
    ) =>
      tx.execute(
        `INSERT INTO project (id, name, deadline, status, budget, investor_id, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, deadline, status, budget, investorId, TS, TS, archivedAt],
      );
    await project(BASIC.projects.villa, "Villa Lake", BASIC.investors.alpha, "2025-06-30", "DONE", 12_000_000, null);
    await project(BASIC.projects.tower, "Office Tower", BASIC.investors.beta, "2026-12-31", "ACTIVE", 60_000_000, null);
    await project(BASIC.projects.school, "School Annex", BASIC.investors.alpha, "2026-03-31", "ACTIVE", 3_500_000, TS);

    const contract = (
      id: string,
      number: string,
      projectId: string,
      subcontractorId: string | null,
      date: string,
      value: number,
    ) =>
      tx.execute(
        `INSERT INTO contract (id, number, type, project_id, subcontractor_id, value, date, description,
                               created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
        [id, number, subcontractorId ? "OUTGOING" : "INCOMING", projectId, subcontractorId, value, date, TS, TS],
      );
    await contract(BASIC.contracts.villaIn, "V-001", BASIC.projects.villa, null, "2025-02-10", 10_000_000);
    await contract(
      BASIC.contracts.villaOut,
      "V-OUT-1",
      BASIC.projects.villa,
      BASIC.subcontractors.struct,
      "2025-03-15",
      3_000_000,
    );
    await contract(BASIC.contracts.schoolIn, "S-001", BASIC.projects.school, null, "2026-01-20", 3_000_000);
    await contract(
      BASIC.contracts.schoolOut,
      "S-OUT-1",
      BASIC.projects.school,
      BASIC.subcontractors.hvac,
      "2026-02-05",
      800_000,
    );

    const invoice = (
      id: string,
      number: string,
      contractId: string,
      date: string,
      value: number,
      status: string,
      dueDate: string | null,
      withAttachment = false,
    ) =>
      tx.execute(
        `INSERT INTO invoice (id, number, contract_id, value, vat_rate, date, due_date, status, description,
                              attachment_path, attachment_name, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, 2000, ?, ?, ?, NULL, ?, ?, ?, ?, NULL)`,
        [
          id,
          number,
          contractId,
          value,
          date,
          dueDate,
          status,
          withAttachment ? attachment.path : null,
          withAttachment ? attachment.originalName : null,
          TS,
          TS,
        ],
      );
    const { villaIn, villaOut } = BASIC.contracts;
    await invoice(BASIC.invoices.inv001, "INV-001", villaIn, "2025-03-01", 4_000_000, "PAID", "2025-03-31", true);
    await invoice(BASIC.invoices.inv002, "INV-002", villaIn, "2025-06-01", 3_000_000, "ISSUED", "2025-06-30");
    await invoice(BASIC.invoices.inv003, "INV-003", villaIn, "2025-07-01", 1_000_000, "DRAFT", null);
    await invoice(BASIC.invoices.inv004, "INV-004", villaIn, "2025-08-01", 500_000, "CANCELLED", null);
    await invoice(BASIC.invoices.si001, "SI-001", villaOut, "2025-04-10", 1_500_000, "PAID", null);
  });
}
