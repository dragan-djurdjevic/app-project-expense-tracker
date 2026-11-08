// Spec: DEMO-001, DEMO-002, DEMO-003, DEMO-004, DEMO-900, DEMO-901, DEMO-902, DEMO-903, DEMO-904, DEMO-905, DEMO-906, AR-010
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { InMemoryDocumentStorage } from "../../src/adapters/storage/InMemoryDocumentStorage";
import type { DemoPdfFile } from "../../src/app/demo/demoDataset";
import { seedDemoData } from "../../src/app/demo/seedDemoData";
import { INVOICE_STATUSES } from "../../src/core/domain/Invoice";
import { PROJECT_STATUSES } from "../../src/core/domain/Project";
import type { StoredDocumentRef } from "../../src/core/domain/StoredDocumentRef";
import { makeAttachInvoiceDocument } from "../../src/core/usecases/invoice/attachInvoiceDocument";
import { sequentialIds } from "../fixtures/fixedClock";
import { setupServices, value } from "../fixtures/services";

const ASSETS = join(__dirname, "..", "..", "src", "app", "demo", "assets");
const loadPdf = async (file: DemoPdfFile) => new Uint8Array(readFileSync(join(ASSETS, file)));

/** Local noon of a calendar day, as the clock's ISO timestamp. */
const localNoon = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).toISOString();
/** Currency units → minor units. */
const m = (units: number) => Math.round(units * 100);
/** DEMO-002: due date = date + 30 calendar days. */
function plus30(date: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + 30)).toISOString().slice(0, 10);
}

/** Services on a fresh SQLite DB, seeded with the demo data at the given local day. */
async function seeded(year = 2026, month = 6, day = 15) {
  const s = await setupServices();
  s.clock.set(localNoon(year, month, day));
  expect(await seedDemoData(s, s.clock, loadPdf)).toBe(true);
  return s;
}

type Services = Awaited<ReturnType<typeof setupServices>>;

async function all(s: Services) {
  const investors = value(await s.listInvestors({ includeArchived: true }));
  const subcontractors = value(await s.listSubcontractors({ includeArchived: true }));
  const projects = value(await s.listProjects({ includeArchived: true }));
  const contracts = value(await s.listContracts({ includeArchived: true }));
  const invoices = value(await s.listInvoices({ includeArchived: true }));
  return { investors, subcontractors, projects, contracts, invoices };
}

/** DEMO-003 investors: name, VAT number, contact person, email, phone, archived. */
const INVESTORS = [
  ["Northwind Developments", "NWD-1001", "Emma Clarke", "emma.clarke@northwind.example", "+44 20 7946 0101", false],
  ["Harbor City Council", "HCC-2002", "Daniel Moore", "d.moore@harborcity.example", "+44 20 7946 0202", false],
  ["Greenleaf Properties", "GLP-3003", "Sophie Turner", "sophie@greenleaf.example", "+44 20 7946 0303", false],
  ["Summit Retail Group", "SRG-4004", "James Walker", null, null, true],
];

/** DEMO-003 subcontractors: name, VAT number, industry, contact person, email, archived. */
const SUBCONTRACTORS = [
  [
    "Atlas Structural Engineering",
    "ATL-5001",
    "Structural engineering",
    "Oliver Hughes",
    "office@atlas-eng.example",
    false,
  ],
  ["BlueAir HVAC Systems", "BAH-5002", "HVAC", "Grace Bennett", "info@blueair.example", false],
  ["Brightline Electrical", "BLE-5003", "Electrical", "Henry Price", null, false],
  ["Terra Landscaping", "TLS-5004", "Landscaping", "Lucy Ward", "lucy@terra.example", false],
  ["Quartz Interiors", "QIN-5005", "Interior fit-out", null, null, true],
];

/** DEMO-003 projects (Y0 = 2026): name, investor, status, budget, deadline, archived. */
const PROJECTS = [
  ["Riverside Apartments", "Northwind Developments", "ACTIVE", m(850_000), "2027-03-31", false],
  ["Harbor Library Renovation", "Harbor City Council", "DONE", m(300_000), "2025-10-31", false],
  ["Greenleaf Office Park", "Greenleaf Properties", "ACTIVE", m(1_200_000), "2028-06-30", false],
  ["City Sports Hall", "Harbor City Council", "ON_HOLD", m(540_000), "2027-09-30", false],
  ["Lakeside Villa", "Northwind Developments", "DONE", null, "2024-12-15", false],
  ["Summit Mall Extension", "Summit Retail Group", "CANCELLED", m(900_000), "2025-06-30", true],
  ["Greenleaf Kindergarten", "Greenleaf Properties", "PLANNED", m(260_000), "2027-12-31", false],
  ["Old Town Facade Restoration", "Harbor City Council", "DONE", m(150_000), "2024-09-30", false],
];

/** DEMO-003 contracts (Y0 = 2026): number, project, type, subcontractor, value, date, description, archived. */
const CONTRACTS = [
  [
    "LV-IN-01",
    "Lakeside Villa",
    "INCOMING",
    null,
    m(180_000),
    "2024-02-10",
    "Architectural design and site supervision",
    false,
  ],
  [
    "LV-OUT-01",
    "Lakeside Villa",
    "OUTGOING",
    "Atlas Structural Engineering",
    m(30_000),
    "2024-03-01",
    "Structural design",
    false,
  ],
  [
    "LV-OUT-02",
    "Lakeside Villa",
    "OUTGOING",
    "Terra Landscaping",
    m(12_000),
    "2024-05-15",
    "Garden and terrace landscaping",
    false,
  ],
  [
    "OT-IN-01",
    "Old Town Facade Restoration",
    "INCOMING",
    null,
    m(140_000),
    "2024-04-20",
    "Facade restoration design",
    false,
  ],
  [
    "OT-OUT-01",
    "Old Town Facade Restoration",
    "OUTGOING",
    "Atlas Structural Engineering",
    m(25_000),
    "2024-05-05",
    "Structural survey",
    false,
  ],
  [
    "HL-IN-01",
    "Harbor Library Renovation",
    "INCOMING",
    null,
    m(280_000),
    "2025-01-20",
    "Renovation design and supervision",
    false,
  ],
  [
    "HL-IN-02",
    "Harbor Library Renovation",
    "INCOMING",
    null,
    m(50_000),
    "2025-07-01",
    "Addendum: reading room extension",
    false,
  ],
  [
    "HL-OUT-01",
    "Harbor Library Renovation",
    "OUTGOING",
    "BlueAir HVAC Systems",
    m(45_000),
    "2025-02-15",
    "HVAC design",
    false,
  ],
  [
    "HL-OUT-02",
    "Harbor Library Renovation",
    "OUTGOING",
    "Brightline Electrical",
    m(30_000),
    "2025-03-10",
    "Electrical design",
    false,
  ],
  ["RA-IN-01", "Riverside Apartments", "INCOMING", null, m(600_000), "2025-09-15", "Main design contract", false],
  ["RA-IN-02", "Riverside Apartments", "INCOMING", null, m(150_000), "2026-03-01", "Interior design package", false],
  [
    "RA-OUT-01",
    "Riverside Apartments",
    "OUTGOING",
    "Atlas Structural Engineering",
    m(90_000),
    "2025-10-01",
    "Structural engineering",
    false,
  ],
  [
    "RA-OUT-02",
    "Riverside Apartments",
    "OUTGOING",
    "Brightline Electrical",
    m(60_000),
    "2026-02-10",
    "Electrical installations design",
    false,
  ],
  [
    "RA-OUT-03",
    "Riverside Apartments",
    "OUTGOING",
    "Quartz Interiors",
    m(40_000),
    "2026-01-20",
    "Show apartment fit-out",
    false,
  ],
  [
    "GO-IN-01",
    "Greenleaf Office Park",
    "INCOMING",
    null,
    m(950_000),
    "2026-01-15",
    "Office park master plan and design",
    false,
  ],
  [
    "GO-OUT-01",
    "Greenleaf Office Park",
    "OUTGOING",
    "Atlas Structural Engineering",
    m(120_000),
    "2026-02-01",
    "Structural engineering",
    false,
  ],
  [
    "GO-OUT-02",
    "Greenleaf Office Park",
    "OUTGOING",
    "BlueAir HVAC Systems",
    m(85_000),
    "2026-04-10",
    "HVAC design",
    false,
  ],
  ["SH-IN-01", "City Sports Hall", "INCOMING", null, m(400_000), "2025-05-10", "Sports hall design", false],
  [
    "SH-OUT-01",
    "City Sports Hall",
    "OUTGOING",
    "Terra Landscaping",
    m(20_000),
    "2025-06-01",
    "Outdoor areas (terminated)",
    true,
  ],
  [
    "SM-IN-01",
    "Summit Mall Extension",
    "INCOMING",
    null,
    m(200_000),
    "2024-10-01",
    "Mall extension concept design",
    false,
  ],
];

/** DEMO-003 invoices (Y0 = 2026): number, contract, net, VAT bp, date, status, archived. */
const INVOICES = [
  ["LV-2401", "LV-IN-01", m(60_000), 2000, "2024-03-01", "PAID", false],
  ["LV-2402", "LV-IN-01", m(70_000), 2000, "2024-07-01", "PAID", false],
  ["LV-2403", "LV-IN-01", m(50_000), 2000, "2024-11-15", "PAID", false],
  ["LV-S-01", "LV-OUT-01", m(30_000), 2000, "2024-06-01", "PAID", false],
  ["LV-S-02", "LV-OUT-02", m(12_000), 1000, "2024-08-01", "PAID", false],
  ["OT-2401", "OT-IN-01", m(70_000), 2000, "2024-06-15", "PAID", false],
  ["OT-2402", "OT-IN-01", m(70_000), 2000, "2025-01-20", "PAID", false],
  ["OT-S-01", "OT-OUT-01", m(25_000), 2000, "2024-08-20", "PAID", false],
  ["SM-2401", "SM-IN-01", m(40_000), 2000, "2024-11-01", "PAID", false],
  ["SM-2402", "SM-IN-01", m(60_000), 2000, "2025-02-01", "CANCELLED", false],
  ["HL-2501", "HL-IN-01", m(100_000), 2000, "2025-03-01", "PAID", false],
  ["HL-2502", "HL-IN-01", m(100_000), 2000, "2025-06-01", "PAID", false],
  ["HL-2503", "HL-IN-01", m(80_000), 2000, "2025-09-01", "PAID", false],
  ["HL-2504", "HL-IN-02", m(50_000), 2000, "2025-10-15", "PAID", false],
  ["HL-S-01", "HL-OUT-01", m(45_000), 2000, "2025-04-01", "PAID", false],
  ["HL-S-02", "HL-OUT-02", m(20_000), 2000, "2025-05-01", "PAID", false],
  ["HL-S-03", "HL-OUT-02", m(15_000), 2000, "2025-08-01", "PAID", false],
  ["SH-2501", "SH-IN-01", m(120_000), 2000, "2025-06-15", "PAID", false],
  ["SH-2502", "SH-IN-01", m(80_000), 2000, "2025-11-20", "ISSUED", false],
  ["SH-S-01", "SH-OUT-01", m(10_000), 2000, "2025-07-01", "CANCELLED", false],
  ["SH-S-02", "SH-OUT-01", m(5_000), 2000, "2025-08-01", "PAID", false],
  ["RA-2501", "RA-IN-01", m(150_000), 2000, "2025-10-15", "PAID", false],
  ["RA-2502", "RA-IN-01", m(200_000), 2000, "2026-02-01", "PAID", false],
  ["RA-2503", "RA-IN-01", m(100_000), 2000, "2026-05-01", "ISSUED", false],
  ["RA-2601", "RA-IN-02", m(50_000), 2000, "2026-04-01", "PAID", false],
  ["RA-2602", "RA-IN-02", m(40_000), 2000, "2026-06-01", "DRAFT", false],
  ["RA-S-01", "RA-OUT-01", m(45_000), 2000, "2025-12-01", "PAID", false],
  ["RA-S-02", "RA-OUT-01", m(30_000), 2000, "2026-03-15", "PAID", false],
  ["RA-S-03", "RA-OUT-02", m(25_000), 2000, "2026-04-20", "PAID", false],
  ["RA-S-04", "RA-OUT-03", m(20_000), 1000, "2026-03-01", "PAID", false],
  ["RA-S-05", "RA-OUT-03", m(20_000), 1000, "2026-05-10", "ISSUED", false],
  ["RA-2504", "RA-IN-01", m(15_000), 2000, "2026-01-10", "CANCELLED", true],
  ["GO-2601", "GO-IN-01", m(200_000), 2000, "2026-02-01", "PAID", false],
  ["GO-2602", "GO-IN-01", m(150_000), 2000, "2026-04-01", "PAID", false],
  ["GO-2603", "GO-IN-01", m(150_000), 2000, "2026-06-01", "ISSUED", false],
  ["GO-S-01", "GO-OUT-01", m(40_000), 2000, "2026-03-01", "PAID", false],
  ["GO-S-02", "GO-OUT-01", m(30_000), 2000, "2026-05-01", "ISSUED", false],
  ["GO-S-03", "GO-OUT-02", m(25_000), 0, "2026-05-20", "DRAFT", false],
  ["SH-2503", "SH-IN-01", m(40_000), 2000, "2025-11-25", "ISSUED", false],
] as const;

const byFirst = <T extends readonly unknown[]>(rows: readonly T[]) =>
  [...rows].sort((a, b) => String(a[0]).localeCompare(String(b[0])));

describe("demo seed (DEMO-001 … DEMO-004)", () => {
  it("TC-M7-003 seeds the full DEMO-003 dataset through the use cases with every field as specified", async () => {
    const s = await seeded();
    const data = await all(s);

    expect([
      data.investors.length,
      data.subcontractors.length,
      data.projects.length,
      data.contracts.length,
      data.invoices.length,
    ]).toEqual([4, 5, 8, 20, 39]);
    const statusCount = (status: string) => data.invoices.filter((invoice) => invoice.status === status).length;
    expect(INVOICE_STATUSES.map((status) => [status, statusCount(status)])).toEqual([
      ["DRAFT", 2],
      ["ISSUED", 6],
      ["PAID", 28],
      ["CANCELLED", 3],
    ]);

    const archivedNames = [
      ...data.investors.filter((r) => r.archivedAt !== null).map((r) => r.name),
      ...data.subcontractors.filter((r) => r.archivedAt !== null).map((r) => r.name),
      ...data.projects.filter((r) => r.archivedAt !== null).map((r) => r.name),
      ...data.contracts.filter((r) => r.archivedAt !== null).map((r) => r.number),
      ...data.invoices.filter((r) => r.archivedAt !== null).map((r) => r.number),
    ];
    expect(archivedNames).toEqual([
      "Summit Retail Group",
      "Quartz Interiors",
      "Summit Mall Extension",
      "SH-OUT-01",
      "RA-2504",
    ]);

    const investorName = new Map(data.investors.map((r) => [r.id, r.name]));
    const subcontractorName = new Map(data.subcontractors.map((r) => [r.id, r.name]));
    const contractNumber = new Map(data.contracts.map((r) => [r.id, r.number]));

    expect(
      byFirst(
        data.investors.map((r) => [r.name, r.vatNumber, r.contactPerson, r.email, r.phone, r.archivedAt !== null]),
      ),
    ).toEqual(byFirst(INVESTORS));
    expect(
      byFirst(
        data.subcontractors.map((r) => [
          r.name,
          r.vatNumber,
          r.industry,
          r.contactPerson,
          r.email,
          r.archivedAt !== null,
        ]),
      ),
    ).toEqual(byFirst(SUBCONTRACTORS));
    expect(data.subcontractors.every((r) => r.phone === null)).toBe(true);
    expect(
      byFirst(
        data.projects.map((r) => [
          r.name,
          investorName.get(r.investorId),
          r.status,
          r.budget,
          r.deadline,
          r.archivedAt !== null,
        ]),
      ),
    ).toEqual(byFirst(PROJECTS));
    expect(
      byFirst(
        data.contracts.map((r) => [
          r.number,
          r.projectName,
          r.type,
          r.subcontractorId === null ? null : subcontractorName.get(r.subcontractorId),
          r.value,
          r.date,
          r.description,
          r.archivedAt !== null,
        ]),
      ),
    ).toEqual(byFirst(CONTRACTS));
    expect(
      byFirst(
        data.invoices.map((r) => [
          r.number,
          contractNumber.get(r.contractId),
          r.value,
          r.vatRate,
          r.date,
          r.dueDate,
          r.status,
          r.archivedAt !== null,
          r.description,
        ]),
      ),
    ).toEqual(
      byFirst(INVOICES.map((row) => [row[0], row[1], row[2], row[3], row[4], plus30(row[4]), row[5], row[6], null])),
    );
  });

  it("TC-M7-004 availableYears and AN-1 … AN-5 after the seed equal DEMO-901 … DEMO-905", async () => {
    const s = await seeded();
    expect(value(await s.getAvailableYears())).toEqual([2028, 2027, 2026, 2025, 2024]);

    // DEMO-901 AN-1
    const an1 = async (year: number | "ALL", mode: "NET" | "GROSS" = "NET") =>
      value(await s.getContractedVsCollected(year, mode));
    const an1Rows = (report: Awaited<ReturnType<typeof an1>>) =>
      report.rows.map((r) => [r.projectName, r.projectArchived, r.contracted, r.collected, r.collectedPercent]);
    const an1Footer = (report: Awaited<ReturnType<typeof an1>>) => report.footer;

    const y2026 = await an1(2026);
    expect(an1Rows(y2026)).toEqual([
      ["Greenleaf Office Park", false, m(950_000), m(350_000), 36.8],
      ["Riverside Apartments", false, m(150_000), m(250_000), 166.7],
    ]);
    expect(an1Footer(y2026)).toEqual({
      projectCount: 2,
      contractedInYearCount: 2,
      contracted: m(1_100_000),
      collected: m(600_000),
      collectedPercent: 54.5,
    });
    const y2025 = await an1(2025);
    expect(y2025.rows.map((r) => r.projectName)).toEqual([
      "City Sports Hall",
      "Harbor Library Renovation",
      "Old Town Facade Restoration",
      "Riverside Apartments",
    ]);
    expect(an1Rows(y2025)[2]).toEqual(["Old Town Facade Restoration", false, 0, m(70_000), null]);
    expect(an1Footer(y2025)).toEqual({
      projectCount: 4,
      contractedInYearCount: 3,
      contracted: m(1_330_000),
      collected: m(670_000),
      collectedPercent: 50.4,
    });
    expect(an1Footer(await an1(2024))).toEqual({
      projectCount: 3,
      contractedInYearCount: 3,
      contracted: m(520_000),
      collected: m(290_000),
      collectedPercent: 55.8,
    });
    const allYears = await an1("ALL");
    expect(an1Rows(allYears)).toEqual([
      ["City Sports Hall", false, m(400_000), m(120_000), 30.0],
      ["Greenleaf Office Park", false, m(950_000), m(350_000), 36.8],
      ["Harbor Library Renovation", false, m(330_000), m(330_000), 100.0],
      ["Lakeside Villa", false, m(180_000), m(180_000), 100.0],
      ["Old Town Facade Restoration", false, m(140_000), m(140_000), 100.0],
      ["Riverside Apartments", false, m(750_000), m(400_000), 53.3],
      ["Summit Mall Extension", true, m(200_000), m(40_000), 20.0],
    ]);
    expect(an1Footer(allYears)).toEqual({
      projectCount: 7,
      contractedInYearCount: 7,
      contracted: m(2_950_000),
      collected: m(1_560_000),
      collectedPercent: 52.9,
    });
    const gross2026 = an1Footer(await an1(2026, "GROSS"));
    expect([gross2026.collected, gross2026.collectedPercent]).toEqual([m(720_000), 54.5]);

    // DEMO-902 AN-2
    const totals = (r: {
      contractedOut: number;
      paidOut: number;
      paidPercent: number | null;
      collected: number;
      sharePercent: number | null;
      retained: number;
      retainedPercent: number | null;
    }) => [r.contractedOut, r.paidOut, r.paidPercent, r.collected, r.sharePercent, r.retained, r.retainedPercent];
    const an2 = value(await s.getSubcontractorPayments(2026, "NET"));
    expect(
      an2.rows.map((r) => [
        r.projectName,
        ...totals(r),
        r.subcontractors.map((sub) => [
          sub.subcontractorName,
          sub.contractedOut,
          sub.paidOut,
          sub.paidPercent,
          sub.sharePercent,
        ]),
      ]),
    ).toEqual([
      [
        "Greenleaf Office Park",
        m(205_000),
        m(40_000),
        19.5,
        m(350_000),
        11.4,
        m(310_000),
        88.6,
        [
          ["Atlas Structural Engineering", m(120_000), m(40_000), 33.3, 11.4],
          ["BlueAir HVAC Systems", m(85_000), 0, 0.0, 0.0],
        ],
      ],
      [
        "Riverside Apartments",
        m(100_000),
        m(75_000),
        75.0,
        m(250_000),
        30.0,
        m(175_000),
        70.0,
        [
          ["Atlas Structural Engineering", 0, m(30_000), null, 12.0],
          ["Brightline Electrical", m(60_000), m(25_000), 41.7, 10.0],
          ["Quartz Interiors", m(40_000), m(20_000), 50.0, 8.0],
        ],
      ],
    ]);
    expect(totals(an2.footer)).toEqual([m(305_000), m(115_000), 37.7, m(600_000), 19.2, m(485_000), 80.8]);
    const an2y2025 = value(await s.getSubcontractorPayments(2025, "NET"));
    expect(totals(an2y2025.footer)).toEqual([m(185_000), m(130_000), 70.3, m(670_000), 19.4, m(540_000), 80.6]);
    const library = an2y2025.rows.find((r) => r.projectName === "Harbor Library Renovation");
    expect([library?.contractedOut, library?.paidOut, library?.paidPercent]).toEqual([m(75_000), m(80_000), 106.7]);
    const an2All = value(await s.getSubcontractorPayments("ALL", "NET"));
    expect(totals(an2All.footer)).toEqual([m(557_000), m(312_000), 56.0, m(1_560_000), 20.0, m(1_248_000), 80.0]);

    // DEMO-903 AN-3
    const an3 = async (year: number) => {
      const report = value(await s.getProjectsInYear(year));
      return {
        rows: report.rows.map((r) => [r.projectName, r.contractedInYear]),
        footer: report.footer,
      };
    };
    expect(await an3(2026)).toEqual({
      rows: [
        ["Greenleaf Office Park", m(950_000)],
        ["Riverside Apartments", m(150_000)],
      ],
      footer: { projectCount: 2, budget: m(2_050_000), contractedInYear: m(1_100_000) },
    });
    expect(await an3(2025)).toEqual({
      rows: [
        ["City Sports Hall", m(400_000)],
        ["Harbor Library Renovation", m(330_000)],
        ["Riverside Apartments", m(600_000)],
        ["Summit Mall Extension", 0],
      ],
      footer: { projectCount: 4, budget: m(2_590_000), contractedInYear: m(1_330_000) },
    });
    expect(await an3(2027)).toEqual({
      rows: [
        ["City Sports Hall", 0],
        ["Greenleaf Kindergarten", 0],
        ["Riverside Apartments", 0],
      ],
      footer: { projectCount: 3, budget: m(1_650_000), contractedInYear: 0 },
    });

    // DEMO-904 AN-4
    const an4 = value(await s.getNetResult(2026, "NET"));
    expect(an4.rows.map((r) => [r.projectName, r.collected, r.paidOut, r.net, r.marginPercent])).toEqual([
      ["Greenleaf Office Park", m(350_000), m(40_000), m(310_000), 88.6],
      ["Riverside Apartments", m(250_000), m(75_000), m(175_000), 70.0],
    ]);
    expect(an4.footer).toEqual({ collected: m(600_000), paidOut: m(115_000), net: m(485_000), marginPercent: 80.8 });
    expect(value(await s.getNetResult("ALL", "NET")).footer).toEqual({
      collected: m(1_560_000),
      paidOut: m(312_000),
      net: m(1_248_000),
      marginPercent: 80.0,
    });
    expect(value(await s.getNetResult(2026, "GROSS")).footer).toEqual({
      collected: m(720_000),
      paidOut: m(136_000),
      net: m(584_000),
      marginPercent: 80.8,
    });

    // DEMO-905 AN-5
    const an5 = value(await s.getBudgetRealisation());
    expect(
      an5.rows.map((r) => [
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
      ["City Sports Hall", false, m(540_000), m(400_000), 74.1, m(240_000), m(120_000), 22.2, 30.0, m(420_000)],
      ["Greenleaf Kindergarten", false, m(260_000), 0, 0.0, 0, 0, 0.0, null, m(260_000)],
      ["Greenleaf Office Park", false, m(1_200_000), m(950_000), 79.2, m(500_000), m(350_000), 29.2, 36.8, m(850_000)],
      [
        "Harbor Library Renovation",
        false,
        m(300_000),
        m(330_000),
        110.0,
        m(330_000),
        m(330_000),
        110.0,
        100.0,
        -m(30_000),
      ],
      ["Lakeside Villa", false, null, m(180_000), null, m(180_000), m(180_000), null, 100.0, null],
      [
        "Old Town Facade Restoration",
        false,
        m(150_000),
        m(140_000),
        93.3,
        m(140_000),
        m(140_000),
        93.3,
        100.0,
        m(10_000),
      ],
      ["Riverside Apartments", false, m(850_000), m(750_000), 88.2, m(500_000), m(400_000), 47.1, 53.3, m(450_000)],
      ["Summit Mall Extension", true, m(900_000), m(200_000), 22.2, m(40_000), m(40_000), 4.4, 20.0, m(860_000)],
    ]);
    expect(an5.footer).toEqual({
      budget: m(4_200_000),
      contracted: m(2_950_000),
      invoiced: m(1_930_000),
      collected: m(1_560_000),
      remaining: m(2_820_000),
      contractedPercentOfBudget: 66.0,
      realisationPercentOfBudget: 32.9,
      realisationPercentOfContracted: 52.9,
    });
  });

  it("TC-M7-005 with today 2026-01-03 Y0 dates are clamped and DEMO-900 footers and overdue set hold", async () => {
    const s = await seeded(2026, 1, 3);
    const data = await all(s);
    const y0Contracts = data.contracts.filter((r) => r.date.startsWith("2026"));
    const y0Invoices = data.invoices.filter((r) => r.date.startsWith("2026"));
    expect(y0Contracts.map((r) => r.number).sort()).toEqual(
      ["RA-IN-02", "RA-OUT-02", "RA-OUT-03", "GO-IN-01", "GO-OUT-01", "GO-OUT-02"].sort(),
    );
    expect(y0Invoices).toHaveLength(15);
    for (const row of [...y0Contracts, ...y0Invoices]) {
      expect(row.date >= "2026-01-01" && row.date <= "2026-01-03", `${row.number} ${row.date}`).toBe(true);
    }

    expect(value(await s.getContractedVsCollected(2026, "NET")).footer).toEqual({
      projectCount: 2,
      contractedInYearCount: 2,
      contracted: m(1_100_000),
      collected: m(600_000),
      collectedPercent: 54.5,
    });
    expect(value(await s.getNetResult(2026, "NET")).footer).toEqual({
      collected: m(600_000),
      paidOut: m(115_000),
      net: m(485_000),
      marginPercent: 80.8,
    });
    expect(value(await s.getBudgetRealisation()).footer).toEqual({
      budget: m(4_200_000),
      contracted: m(2_950_000),
      invoiced: m(1_930_000),
      collected: m(1_560_000),
      remaining: m(2_820_000),
      contractedPercentOfBudget: 66.0,
      realisationPercentOfBudget: 32.9,
      realisationPercentOfContracted: 52.9,
    });
    const overdue = data.invoices.filter((r) => r.overdue).map((r) => r.number);
    expect(overdue.sort()).toEqual(["SH-2502", "SH-2503"]);

    const june = await seeded(2026, 6, 15);
    const juneOverdue = value(await june.listInvoices({ includeArchived: true }))
      .filter((r) => r.overdue)
      .map((r) => r.number);
    expect(juneOverdue.sort()).toEqual(["GO-S-02", "RA-2503", "RA-S-05", "SH-2502", "SH-2503"]);
  });

  it("TC-M7-006 a second run changes nothing; a DB with only one archived investor is not seeded", async () => {
    const s = await seeded();
    const snapshot = async () => {
      const rows: Record<string, unknown[]> = {};
      for (const table of ["investor", "subcontractor", "project", "contract", "invoice"]) {
        rows[table] = await s.db.select(`SELECT id, updated_at FROM ${table} ORDER BY id`);
      }
      return rows;
    };
    const before = await snapshot();
    s.clock.set(localNoon(2026, 6, 20));
    expect(await seedDemoData(s, s.clock, loadPdf)).toBe(false);
    expect(await snapshot()).toEqual(before);
    expect(Object.values(before).map((rows) => rows.length)).toEqual([4, 5, 8, 20, 39]);

    const other = await setupServices();
    const investor = value(await other.createInvestor({ name: "Only One", vatNumber: "ONE-1" }));
    value(await other.archiveInvestor(investor.id));
    expect(await seedDemoData(other, other.clock, loadPdf)).toBe(false);
    expect(value(await other.listInvestors({ includeArchived: true })).map((r) => r.name)).toEqual(["Only One"]);
    expect(value(await other.listProjects({ includeArchived: true }))).toEqual([]);
  });

  it("TC-M7-007 V01, V11 and V33 get the demo PDFs as LV-2401.pdf, HL-2501.pdf, GO-2601.pdf", async () => {
    const s = await setupServices();
    s.clock.set(localNoon(2026, 6, 15));
    const inner = new InMemoryDocumentStorage(sequentialIds("91000000-0000-4000-8000-"));
    const saved: { ref: StoredDocumentRef; bytes: Uint8Array }[] = [];
    const documents = {
      save: async (bytes: Uint8Array, originalName: string, ownerId: string) => {
        const ref = await inner.save(bytes, originalName, ownerId);
        saved.push({ ref, bytes: bytes.slice() });
        return ref;
      },
      open: () => inner.open(),
      remove: (ref: StoredDocumentRef) => inner.remove(ref),
      exists: (ref: StoredDocumentRef) => inner.exists(ref),
    };
    const attachInvoiceDocument = makeAttachInvoiceDocument({ invoiceRepo: s.invoiceRepo, documents, clock: s.clock });
    expect(await seedDemoData({ ...s, attachInvoiceDocument }, s.clock, loadPdf)).toBe(true);

    const invoices = value(await s.listInvoices({ includeArchived: true }));
    const attached = invoices
      .filter((r) => r.attachment !== null)
      .map((r) => [r.number, r.attachment?.originalName])
      .sort();
    expect(attached).toEqual([
      ["GO-2601", "GO-2601.pdf"],
      ["HL-2501", "HL-2501.pdf"],
      ["LV-2401", "LV-2401.pdf"],
    ]);
    expect(saved).toHaveLength(3);
    for (const { ref, bytes } of saved) {
      expect(await inner.exists(ref)).toBe(true);
      expect(new TextDecoder("ascii").decode(bytes.slice(0, 5))).toBe("%PDF-");
      expect(bytes.length).toBeLessThanOrEqual(10 * 1024);
    }
  });

  it("TC-M7-008 the dataset covers every status, an over-budget, a budget-less, a contract-less project, C09 and VAT 20/10/0", async () => {
    const s = await seeded();
    const data = await all(s);
    expect(PROJECT_STATUSES.filter((status) => !data.projects.some((r) => r.status === status))).toEqual([]);
    expect(INVOICE_STATUSES.filter((status) => !data.invoices.some((r) => r.status === status))).toEqual([]);

    const an5 = value(await s.getBudgetRealisation());
    const p2 = an5.rows.find((r) => r.projectName === "Harbor Library Renovation");
    expect(p2?.realisationPercentOfBudget).toBeGreaterThan(100);
    expect(p2?.remaining).toBeLessThan(0);
    expect(data.projects.find((r) => r.name === "Lakeside Villa")?.budget).toBeNull();
    const p7 = data.projects.find((r) => r.name === "Greenleaf Kindergarten");
    expect(data.contracts.filter((r) => r.projectId === p7?.id)).toEqual([]);

    const c09 = data.contracts.find((r) => r.number === "HL-OUT-02");
    const c09Invoiced = data.invoices
      .filter((r) => r.contractId === c09?.id && r.status !== "CANCELLED")
      .reduce((sum, r) => sum + r.value, 0);
    expect(c09Invoiced).toBe(m(35_000));
    expect(c09Invoiced).toBeGreaterThan(c09?.value ?? Infinity);

    const rates = new Set(data.invoices.map((r) => r.vatRate));
    expect([2000, 1000, 0].every((rate) => rates.has(rate))).toBe(true);
  });
});
