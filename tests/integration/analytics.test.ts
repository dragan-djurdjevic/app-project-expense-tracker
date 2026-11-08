// Spec: AN-000, AN-1, AN-2, AN-3, AN-4, AN-5, AN-900, AN-901, AN-902, AN-903, AN-904, AN-905, UI-030
import { describe, expect, it } from "vitest";
import { makeGetAvailableYears } from "../../src/core/usecases/project/getAvailableYears";
import { ANALYTICS, analyticsFixture } from "../fixtures/analytics";
import { setupServices, value } from "../fixtures/services";

/** EUR amount → minor units. */
const m = (eur: number) => Math.round(eur * 100);
const { P1, P2, P3, P4 } = ANALYTICS.projects;

async function seeded() {
  const s = await setupServices();
  await analyticsFixture(s.db);
  return s;
}

describe("analytics (AN-900 fixture)", () => {
  it("TC-M5-002 availableYears() on fixture is [2027, 2026, 2025]; on empty DB [currentYear]", async () => {
    const s = await seeded();
    expect(await s.analyticsQuery.availableYears()).toEqual([2027, 2026, 2025]);
    expect(value(await s.getAvailableYears())).toEqual([2027, 2026, 2025]);

    const empty = await setupServices();
    expect(await empty.analyticsQuery.availableYears()).toEqual([]);
    expect(value(await empty.getAvailableYears())).toEqual([2026]);
    empty.clock.set("2031-06-01T12:00:00.000Z");
    const later = makeGetAvailableYears({ projectRepo: empty.projectRepo, clock: empty.clock });
    expect(value(await later())).toEqual([2031]);
  });

  it("TC-M5-003 AN-1 year 2025 rows and footer equal AN-901", async () => {
    const s = await seeded();
    const report = value(await s.getContractedVsCollected(2025, "NET"));
    expect(report.rows).toEqual([
      {
        projectId: P2,
        projectName: "Office Tower",
        projectArchived: false,
        investorName: "Beta Holding",
        contracted: m(500_000),
        collected: m(100_000),
        contractedInYear: true,
        collectedPercent: 20.0,
      },
      {
        projectId: P1,
        projectName: "Villa Lake",
        projectArchived: false,
        investorName: "Alpha Invest",
        contracted: m(100_000),
        collected: m(100_000),
        contractedInYear: true,
        collectedPercent: 100.0,
      },
    ]);
    expect(report.footer).toEqual({
      projectCount: 2,
      contractedInYearCount: 2,
      contracted: m(600_000),
      collected: m(200_000),
      collectedPercent: 33.3,
    });
  });

  it("TC-M5-004 AN-1 year 2026 rows and footer equal AN-901 incl. Villa Lake — and archived School Annex", async () => {
    const s = await seeded();
    const report = value(await s.getContractedVsCollected(2026, "NET"));
    expect(report.rows).toEqual([
      {
        projectId: P2,
        projectName: "Office Tower",
        projectArchived: false,
        investorName: "Beta Holding",
        contracted: m(50_000),
        collected: m(150_000),
        contractedInYear: true,
        collectedPercent: 300.0,
      },
      {
        projectId: P3,
        projectName: "School Annex",
        projectArchived: true,
        investorName: "Alpha Invest",
        contracted: m(30_000),
        collected: m(15_000),
        contractedInYear: true,
        collectedPercent: 50.0,
      },
      {
        projectId: P1,
        projectName: "Villa Lake",
        projectArchived: false,
        investorName: "Alpha Invest",
        contracted: 0,
        collected: m(5_000),
        contractedInYear: false,
        collectedPercent: null,
      },
    ]);
    expect(report.footer).toEqual({
      projectCount: 3,
      contractedInYearCount: 2,
      contracted: m(80_000),
      collected: m(170_000),
      collectedPercent: 212.5,
    });
  });

  it("TC-M5-005 AN-1 All years equals AN-901", async () => {
    const s = await seeded();
    const report = value(await s.getContractedVsCollected("ALL", "NET"));
    expect(
      report.rows.map((r) => [r.projectName, r.projectArchived, r.contracted, r.collected, r.collectedPercent]),
    ).toEqual([
      ["Office Tower", false, m(550_000), m(250_000), 45.5],
      ["School Annex", true, m(30_000), m(15_000), 50.0],
      ["Villa Lake", false, m(100_000), m(105_000), 105.0],
    ]);
    expect(report.footer).toEqual({
      projectCount: 3,
      contractedInYearCount: 3,
      contracted: m(680_000),
      collected: m(370_000),
      collectedPercent: 54.4,
    });
  });

  it("TC-M5-006 AN-1 2027 has no rows and a zero footer", async () => {
    const s = await seeded();
    const report = value(await s.getContractedVsCollected(2027, "NET"));
    expect(report.rows).toEqual([]);
    expect(report.footer).toEqual({
      projectCount: 0,
      contractedInYearCount: 0,
      contracted: 0,
      collected: 0,
      collectedPercent: null,
    });
  });

  it("TC-M5-007 AN-1 gross 2025 collected equals AN-901 gross line; percentages unchanged", async () => {
    const s = await seeded();
    const report = value(await s.getContractedVsCollected(2025, "GROSS"));
    expect(report.rows.map((r) => [r.projectName, r.contracted, r.collected, r.collectedPercent])).toEqual([
      ["Office Tower", m(500_000), m(120_000), 20.0],
      ["Villa Lake", m(100_000), m(120_000), 100.0],
    ]);
    expect(report.footer).toMatchObject({ contracted: m(600_000), collected: m(240_000), collectedPercent: 33.3 });
  });

  it("TC-M5-008 AN-2 2025 and 2026 rows, sub-rows and footers equal AN-902", async () => {
    const s = await seeded();
    const { S1, S2 } = ANALYTICS.subcontractors;
    const r2025 = value(await s.getSubcontractorPayments(2025, "NET"));
    expect(r2025.rows).toEqual([
      {
        projectId: P2,
        projectName: "Office Tower",
        projectArchived: false,
        contractedOut: 0,
        paidOut: 0,
        paidPercent: null,
        collected: m(100_000),
        sharePercent: 0.0,
        retained: m(100_000),
        retainedPercent: 100.0,
        subcontractors: [],
      },
      {
        projectId: P1,
        projectName: "Villa Lake",
        projectArchived: false,
        contractedOut: m(20_000),
        paidOut: m(20_000),
        paidPercent: 100.0,
        collected: m(100_000),
        sharePercent: 20.0,
        retained: m(80_000),
        retainedPercent: 80.0,
        subcontractors: [
          {
            subcontractorId: S1,
            subcontractorName: "Struct Eng",
            contractedOut: m(20_000),
            paidOut: m(20_000),
            paidPercent: 100.0,
            sharePercent: 20.0,
          },
        ],
      },
    ]);
    expect(r2025.footer).toEqual({
      contractedOut: m(20_000),
      paidOut: m(20_000),
      paidPercent: 100.0,
      collected: m(200_000),
      sharePercent: 10.0,
      retained: m(180_000),
      retainedPercent: 90.0,
    });

    const r2026 = value(await s.getSubcontractorPayments(2026, "NET"));
    expect(r2026.rows).toEqual([
      {
        projectId: P2,
        projectName: "Office Tower",
        projectArchived: false,
        contractedOut: m(120_000),
        paidOut: m(40_000),
        paidPercent: 33.3,
        collected: m(150_000),
        sharePercent: 26.7,
        retained: m(110_000),
        retainedPercent: 73.3,
        subcontractors: [
          {
            subcontractorId: S2,
            subcontractorName: "HVAC Pro",
            contractedOut: m(40_000),
            paidOut: m(10_000),
            paidPercent: 25.0,
            sharePercent: 6.7,
          },
          {
            subcontractorId: S1,
            subcontractorName: "Struct Eng",
            contractedOut: m(80_000),
            paidOut: m(30_000),
            paidPercent: 37.5,
            sharePercent: 20.0,
          },
        ],
      },
      {
        projectId: P3,
        projectName: "School Annex",
        projectArchived: true,
        contractedOut: 0,
        paidOut: 0,
        paidPercent: null,
        collected: m(15_000),
        sharePercent: 0.0,
        retained: m(15_000),
        retainedPercent: 100.0,
        subcontractors: [],
      },
      {
        projectId: P1,
        projectName: "Villa Lake",
        projectArchived: false,
        contractedOut: 0,
        paidOut: 0,
        paidPercent: null,
        collected: m(5_000),
        sharePercent: 0.0,
        retained: m(5_000),
        retainedPercent: 100.0,
        subcontractors: [],
      },
    ]);
    expect(r2026.footer).toEqual({
      contractedOut: m(120_000),
      paidOut: m(40_000),
      paidPercent: 33.3,
      collected: m(170_000),
      sharePercent: 23.5,
      retained: m(130_000),
      retainedPercent: 76.5,
    });
  });

  it("TC-M5-009 AN-3 2025, 2026 and 2027 equal AN-903", async () => {
    const s = await seeded();
    const r2025 = value(await s.getProjectsInYear(2025));
    expect(r2025.rows.map((r) => [r.projectName, r.contractedInYear, r.budget])).toEqual([
      ["Office Tower", m(500_000), m(600_000)],
      ["Villa Lake", m(100_000), m(120_000)],
    ]);
    expect(r2025.footer).toEqual({ projectCount: 2, budget: m(720_000), contractedInYear: m(600_000) });

    const r2026 = value(await s.getProjectsInYear(2026));
    expect(r2026.rows.map((r) => [r.projectName, r.contractedInYear, r.budget, r.projectArchived])).toEqual([
      ["Office Tower", m(50_000), m(600_000), false],
      ["School Annex", m(30_000), m(35_000), true],
    ]);
    expect(r2026.footer).toEqual({ projectCount: 2, budget: m(635_000), contractedInYear: m(80_000) });

    const r2027 = value(await s.getProjectsInYear(2027));
    expect(r2027.rows).toEqual([
      {
        projectId: P4,
        projectName: "Library",
        projectArchived: false,
        investorName: "Beta Holding",
        status: "PLANNED",
        deadline: "2027-05-01",
        budget: null,
        contractedInYear: 0,
      },
    ]);
    expect(r2027.footer).toEqual({ projectCount: 1, budget: 0, contractedInYear: 0 });
  });

  it("TC-M5-010 AN-4 2025 and 2026 equal AN-904; gross 2026 footer equals AN-904 gross line", async () => {
    const s = await seeded();
    const r2025 = value(await s.getNetResult(2025, "NET"));
    expect(r2025.rows.map((r) => [r.projectName, r.collected, r.paidOut, r.net, r.marginPercent])).toEqual([
      ["Office Tower", m(100_000), 0, m(100_000), 100.0],
      ["Villa Lake", m(100_000), m(20_000), m(80_000), 80.0],
    ]);
    expect(r2025.footer).toEqual({
      collected: m(200_000),
      paidOut: m(20_000),
      net: m(180_000),
      marginPercent: 90.0,
    });

    const r2026 = value(await s.getNetResult(2026, "NET"));
    expect(r2026.rows.map((r) => [r.projectName, r.collected, r.paidOut, r.net, r.marginPercent])).toEqual([
      ["Office Tower", m(150_000), m(40_000), m(110_000), 73.3],
      ["School Annex", m(15_000), 0, m(15_000), 100.0],
      ["Villa Lake", m(5_000), 0, m(5_000), 100.0],
    ]);
    expect(r2026.footer).toEqual({
      collected: m(170_000),
      paidOut: m(40_000),
      net: m(130_000),
      marginPercent: 76.5,
    });

    const gross = value(await s.getNetResult(2026, "GROSS"));
    expect(gross.footer).toEqual({
      collected: m(204_000),
      paidOut: m(48_000),
      net: m(156_000),
      marginPercent: 76.5,
    });
  });

  it("TC-M5-011 CANCELLED (V7), DRAFT (V9) and ISSUED (V6) contribute nothing to collected/paid", async () => {
    const snapshot = async (s: Awaited<ReturnType<typeof seeded>>) => {
      const out: unknown[] = [];
      for (const year of [2025, 2026, 2027, "ALL"] as const) {
        for (const mode of ["NET", "GROSS"] as const) {
          out.push(value(await s.getContractedVsCollected(year, mode)));
          out.push(value(await s.getSubcontractorPayments(year, mode)));
          out.push(value(await s.getNetResult(year, mode)));
        }
        if (year !== "ALL") out.push(value(await s.getProjectsInYear(year)));
      }
      const realisation = value(await s.getBudgetRealisation());
      out.push(
        realisation.rows.map((r) => [
          r.projectId,
          r.collected,
          r.realisationPercentOfBudget,
          r.realisationPercentOfContracted,
        ]),
      );
      const { footer } = realisation;
      out.push([footer.collected, footer.realisationPercentOfBudget, footer.realisationPercentOfContracted]);
      return out;
    };
    const full = await seeded();
    const before = await snapshot(full);
    const { V6, V7, V9 } = ANALYTICS.invoices;
    await full.db.execute("DELETE FROM invoice WHERE id IN (?, ?, ?)", [V6, V7, V9]);
    expect(await snapshot(full)).toEqual(before);
  });

  it("TC-M5-012 Projects list Year filter returns the same set as AN-3 for 2025, 2026 and 2027", async () => {
    const s = await seeded();
    for (const year of [2025, 2026, 2027]) {
      const listed = value(await s.listProjects({ year, includeArchived: true }))
        .map((p) => p.id)
        .sort();
      const an3 = value(await s.getProjectsInYear(year))
        .rows.map((r) => r.projectId)
        .sort();
      expect(listed).toEqual(an3);
    }
  });

  it("TC-M5-013 AN-5 all statuses: every row and footer equal AN-905", async () => {
    const s = await seeded();
    const report = value(await s.getBudgetRealisation([]));
    expect(
      report.rows.map((r) => [
        r.projectName,
        r.projectArchived,
        r.budget,
        r.contracted,
        r.contractedPercentOfBudget,
        r.invoiced,
        r.collected,
        r.realisationPercentOfBudget,
        r.realisationPercentOfContracted,
        r.remaining,
      ]),
    ).toEqual([
      ["Library", false, null, 0, null, 0, 0, null, null, null],
      ["Office Tower", false, m(600_000), m(550_000), 91.7, m(350_000), m(250_000), 41.7, 45.5, m(350_000)],
      ["School Annex", true, m(35_000), m(30_000), 85.7, m(15_000), m(15_000), 42.9, 50.0, m(20_000)],
      ["Villa Lake", false, m(120_000), m(100_000), 83.3, m(105_000), m(105_000), 87.5, 105.0, m(15_000)],
    ]);
    expect(report.rows.map((r) => [r.investorName, r.status])).toEqual([
      ["Beta Holding", "PLANNED"],
      ["Beta Holding", "ACTIVE"],
      ["Alpha Invest", "ACTIVE"],
      ["Alpha Invest", "DONE"],
    ]);
    expect(report.footer).toEqual({
      budget: m(755_000),
      contracted: m(680_000),
      contractedPercentOfBudget: 90.1,
      invoiced: m(470_000),
      collected: m(370_000),
      realisationPercentOfBudget: 49.0,
      realisationPercentOfContracted: 54.4,
      remaining: m(385_000),
    });
  });

  it("TC-M5-014 AN-5 status filter ACTIVE: rows and footer equal the AN-905 note", async () => {
    const s = await seeded();
    const report = value(await s.getBudgetRealisation(["ACTIVE"]));
    expect(report.rows.map((r) => r.projectName)).toEqual(["Office Tower", "School Annex"]);
    expect(report.footer).toMatchObject({
      budget: m(635_000),
      collected: m(265_000),
      realisationPercentOfBudget: 41.7,
    });
  });

  it("TC-M5-015 AN-2 retained can be negative: extra PAID OUTGOING 200,000.00 on C5 in 2026", async () => {
    const s = await seeded();
    await s.db.execute(
      `INSERT INTO invoice (id, number, contract_id, value, vat_rate, date, due_date, status, description,
                            attachment_path, attachment_name, created_at, updated_at, archived_at)
       VALUES (?, 'INV-13', ?, ?, 2000, '2026-06-01', NULL, 'PAID', NULL, NULL, NULL, ?, ?, NULL)`,
      [
        "65000000-0000-4000-8000-000000000013",
        ANALYTICS.contracts.C5,
        m(200_000),
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      ],
    );
    const report = value(await s.getSubcontractorPayments(2026, "NET"));
    const tower = report.rows.find((r) => r.projectId === P2);
    expect(tower).toMatchObject({ retained: m(-90_000), retainedPercent: -60.0 });
  });
});
