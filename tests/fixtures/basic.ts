// Spec: AR-009, DM-010, DM-020, DM-030
import type { SqlDriver } from "../../src/adapters/sqlite/SqlDriver";

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
} as const;

/** Fixture "basic" (M2): 2 investors, 2 subcontractors, 3 projects (1 archived). */
export async function basicFixture(db: SqlDriver): Promise<void> {
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
  });
}
