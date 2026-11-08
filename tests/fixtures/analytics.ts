// Spec: AN-900, AR-009, DM-010, DM-020, DM-030, DM-040, DM-050
import type { SqlDriver } from "../../src/adapters/sqlite/SqlDriver";

const TS = "2026-01-01T00:00:00.000Z";

/** Stable ids of the AN-900 `analytics` fixture rows (keys as in AN-900). */
export const ANALYTICS = {
  investors: {
    I1: "61000000-0000-4000-8000-000000000001",
    I2: "61000000-0000-4000-8000-000000000002",
  },
  subcontractors: {
    S1: "62000000-0000-4000-8000-000000000001",
    S2: "62000000-0000-4000-8000-000000000002",
  },
  projects: {
    /** Villa Lake. */
    P1: "63000000-0000-4000-8000-000000000001",
    /** Office Tower. */
    P2: "63000000-0000-4000-8000-000000000002",
    /** School Annex (archived). */
    P3: "63000000-0000-4000-8000-000000000003",
    /** Library. */
    P4: "63000000-0000-4000-8000-000000000004",
  },
  contracts: {
    C1: "64000000-0000-4000-8000-000000000001",
    C2: "64000000-0000-4000-8000-000000000002",
    C3: "64000000-0000-4000-8000-000000000003",
    C4: "64000000-0000-4000-8000-000000000004",
    C5: "64000000-0000-4000-8000-000000000005",
    C6: "64000000-0000-4000-8000-000000000006",
    C7: "64000000-0000-4000-8000-000000000007",
  },
  invoices: {
    V1: "65000000-0000-4000-8000-000000000001",
    V2: "65000000-0000-4000-8000-000000000002",
    V3: "65000000-0000-4000-8000-000000000003",
    V4: "65000000-0000-4000-8000-000000000004",
    V5: "65000000-0000-4000-8000-000000000005",
    V6: "65000000-0000-4000-8000-000000000006",
    V7: "65000000-0000-4000-8000-000000000007",
    V8: "65000000-0000-4000-8000-000000000008",
    V9: "65000000-0000-4000-8000-000000000009",
    V10: "65000000-0000-4000-8000-000000000010",
    V11: "65000000-0000-4000-8000-000000000011",
    V12: "65000000-0000-4000-8000-000000000012",
  },
} as const;

/** Fixture "analytics": exactly the AN-900 worked example (amounts in minor units, all invoices at 20 % VAT). */
export async function analyticsFixture(db: SqlDriver): Promise<void> {
  const { investors: I, subcontractors: S, projects: P, contracts: C, invoices: V } = ANALYTICS;
  await db.transaction(async (tx) => {
    const investor = (id: string, name: string, vat: string) =>
      tx.execute(
        `INSERT INTO investor (id, name, vat_number, contact_person, email, phone, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, NULL)`,
        [id, name, vat, TS, TS],
      );
    await investor(I.I1, "Alpha Invest", "ALPHA001");
    await investor(I.I2, "Beta Holding", "BETA001");

    const subcontractor = (id: string, name: string, vat: string, industry: string) =>
      tx.execute(
        `INSERT INTO subcontractor (id, name, vat_number, industry, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [id, name, vat, industry, TS, TS],
      );
    await subcontractor(S.S1, "Struct Eng", "STRUCT01", "Structural");
    await subcontractor(S.S2, "HVAC Pro", "HVAC01", "HVAC");

    const project = (
      id: string,
      name: string,
      investorId: string,
      deadline: string,
      status: string,
      budget: number | null,
      archived: boolean,
    ) =>
      tx.execute(
        `INSERT INTO project (id, name, deadline, status, budget, investor_id, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, deadline, status, budget, investorId, TS, TS, archived ? TS : null],
      );
    await project(P.P1, "Villa Lake", I.I1, "2025-06-30", "DONE", 12_000_000, false);
    await project(P.P2, "Office Tower", I.I2, "2026-12-31", "ACTIVE", 60_000_000, false);
    await project(P.P3, "School Annex", I.I1, "2026-03-31", "ACTIVE", 3_500_000, true);
    await project(P.P4, "Library", I.I2, "2027-05-01", "PLANNED", null, false);

    const contract = (
      id: string,
      number: string,
      projectId: string,
      subcontractorId: string | null,
      value: number,
      date: string,
    ) =>
      tx.execute(
        `INSERT INTO contract (id, number, type, project_id, subcontractor_id, value, date, description,
                               created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
        [id, number, subcontractorId ? "OUTGOING" : "INCOMING", projectId, subcontractorId, value, date, TS, TS],
      );
    await contract(C.C1, "IN-001", P.P1, null, 10_000_000, "2025-01-15");
    await contract(C.C2, "OUT-001", P.P1, S.S1, 2_000_000, "2025-02-01");
    await contract(C.C3, "IN-002", P.P2, null, 50_000_000, "2025-11-10");
    await contract(C.C4, "IN-003", P.P2, null, 5_000_000, "2026-02-01");
    await contract(C.C5, "OUT-002", P.P2, S.S1, 8_000_000, "2026-01-10");
    await contract(C.C6, "OUT-003", P.P2, S.S2, 4_000_000, "2026-03-01");
    await contract(C.C7, "IN-004", P.P3, null, 3_000_000, "2026-01-20");

    const invoice = (id: string, number: string, contractId: string, value: number, date: string, status: string) =>
      tx.execute(
        `INSERT INTO invoice (id, number, contract_id, value, vat_rate, date, due_date, status, description,
                              attachment_path, attachment_name, created_at, updated_at, archived_at)
         VALUES (?, ?, ?, ?, 2000, ?, NULL, ?, NULL, NULL, NULL, ?, ?, NULL)`,
        [id, number, contractId, value, date, status, TS, TS],
      );
    await invoice(V.V1, "INV-01", C.C1, 4_000_000, "2025-03-01", "PAID");
    await invoice(V.V2, "INV-02", C.C1, 6_000_000, "2025-12-15", "PAID");
    await invoice(V.V3, "INV-03", C.C2, 2_000_000, "2025-04-01", "PAID");
    await invoice(V.V4, "INV-04", C.C3, 10_000_000, "2025-12-01", "PAID");
    await invoice(V.V5, "INV-05", C.C3, 15_000_000, "2026-02-15", "PAID");
    await invoice(V.V6, "INV-06", C.C3, 10_000_000, "2026-05-01", "ISSUED");
    await invoice(V.V7, "INV-07", C.C4, 2_500_000, "2026-03-10", "CANCELLED");
    await invoice(V.V8, "INV-08", C.C5, 3_000_000, "2026-02-20", "PAID");
    await invoice(V.V9, "INV-09", C.C5, 2_000_000, "2026-04-01", "DRAFT");
    await invoice(V.V10, "INV-10", C.C6, 1_000_000, "2026-03-15", "PAID");
    await invoice(V.V11, "INV-11", C.C7, 1_500_000, "2026-02-28", "PAID");
    await invoice(V.V12, "INV-12", C.C1, 500_000, "2026-01-10", "PAID");
  });
}
