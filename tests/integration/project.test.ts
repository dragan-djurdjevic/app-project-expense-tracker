// Spec: DM-000, DM-030, BR-PRJ-001, BR-GEN-004, BR-GEN-005, BR-GEN-006, BR-GEN-008, UI-030, UI-032, AN-3, AN-000
import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES } from "../../src/core/domain/Project";
import { setupServices, value } from "../fixtures/services";

async function withInvestors() {
  const s = await setupServices();
  const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
  const beta = value(await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" }));
  return { ...s, alpha, beta };
}

describe("projects on SQLite (DM-030)", () => {
  it("TC-M2-020 createProject with active investor; status defaults to PLANNED; budget optional", async () => {
    const s = await withInvestors();

    const result = await s.createProject({ name: " Villa Lake ", investorId: s.alpha.id });
    const withBudget = value(
      await s.createProject({
        name: "Office Tower",
        investorId: s.beta.id,
        budget: 60_000_000,
        deadline: "2026-12-31",
      }),
    );

    const expected = {
      id: "00000000-0000-4000-8000-000000000003",
      name: "Villa Lake",
      deadline: null,
      status: "PLANNED",
      budget: null,
      investorId: s.alpha.id,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      archivedAt: null,
    };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await s.projectRepo.get(expected.id)).toEqual(expected);
    expect(await s.projectRepo.get(withBudget.id)).toMatchObject({
      status: "PLANNED",
      budget: 60_000_000,
      deadline: "2026-12-31",
    });
  });

  it("TC-M2-021 createProject with archived investor returns BR-GEN-006; unknown investor id returns not found", async () => {
    const s = await withInvestors();
    await s.archiveInvestor(s.alpha.id);

    expect(await s.createProject({ name: "Villa Lake", investorId: s.alpha.id })).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "investorId" },
    });
    expect(await s.createProject({ name: "Villa Lake", investorId: "99999999-0000-4000-8000-000000000000" })).toEqual({
      ok: false,
      error: { code: "BR-PRJ-001", messageKey: "errors.notFound", field: "investorId" },
    });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM project")).toEqual([{ n: 0 }]);
  });

  it("TC-M2-022 project whose investor is archived after creation stays valid and can be updated without changing investor", async () => {
    const s = await withInvestors();
    const project = value(await s.createProject({ name: "Villa Lake", investorId: s.alpha.id }));
    await s.archiveInvestor(s.alpha.id);
    s.clock.set("2026-06-01T00:00:00.000Z");

    const updated = await s.updateProject(project.id, {
      name: "Villa Lake II",
      investorId: s.alpha.id,
      status: "ACTIVE",
      deadline: "2026-09-30",
      budget: 1_000,
    });

    expect(updated).toEqual({
      ok: true,
      value: {
        ...project,
        name: "Villa Lake II",
        status: "ACTIVE",
        deadline: "2026-09-30",
        budget: 1_000,
        updatedAt: "2026-06-01T00:00:00.000Z",
      },
    });
    expect(value(await s.listProjects()).map((p) => [p.name, p.investorName])).toEqual([
      ["Villa Lake II", "Alpha Invest"],
    ]);
    // Moving the project to the archived investor from another one is still rejected (BR-GEN-006).
    const other = value(await s.createProject({ name: "Office Tower", investorId: s.beta.id }));
    expect(await s.updateProject(other.id, { name: "Office Tower", investorId: s.alpha.id })).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "investorId" },
    });
  });

  it("TC-M2-023 project status can change between any two values", async () => {
    const s = await withInvestors();
    const project = value(await s.createProject({ name: "Villa Lake", investorId: s.alpha.id }));

    for (const from of PROJECT_STATUSES) {
      for (const to of PROJECT_STATUSES) {
        value(await s.updateProject(project.id, { name: "Villa Lake", investorId: s.alpha.id, status: from }));
        const result = await s.updateProject(project.id, { name: "Villa Lake", investorId: s.alpha.id, status: to });
        expect(result.ok, `${from} → ${to}`).toBe(true);
        expect((await s.projectRepo.get(project.id))?.status).toBe(to);
      }
    }
  });

  it("TC-M2-024 project list filters: status multi-select, investorId, year per AN-3", async () => {
    const s = await withInvestors();
    value(
      await s.createProject({ name: "Villa Lake", investorId: s.alpha.id, status: "DONE", deadline: "2025-06-30" }),
    );
    const tower = value(
      await s.createProject({ name: "Office Tower", investorId: s.beta.id, status: "ACTIVE", deadline: "2026-12-31" }),
    );
    const school = value(
      await s.createProject({ name: "School Annex", investorId: s.alpha.id, status: "ACTIVE", deadline: "2026-03-31" }),
    );
    const library = value(await s.createProject({ name: "Library", investorId: s.beta.id, status: "ON_HOLD" }));
    // Contract rows inserted directly (contracts arrive in M3): Office Tower signed 2025, Library signed 2027
    // (archived contract and OUTGOING type count too).
    const ts = "2026-01-01T00:00:00.000Z";
    await s.db.execute(
      "INSERT INTO subcontractor (id, name, vat_number, created_at, updated_at) VALUES ('s1', 'Struct Eng', 'STRUCT01', ?, ?)",
      [ts, ts],
    );
    await s.db.execute(
      `INSERT INTO contract (id, number, type, project_id, subcontractor_id, value, date, created_at, updated_at, archived_at)
       VALUES ('c1', 'IN-002', 'INCOMING', ?, NULL, 100, '2025-11-10', ?, ?, NULL),
              ('c2', 'OUT-009', 'OUTGOING', ?, 's1', 100, '2027-01-15', ?, ?, ?)`,
      [tower.id, ts, ts, library.id, ts, ts, ts],
    );
    const names = async (filter: Parameters<typeof s.listProjects>[0]) =>
      value(await s.listProjects(filter)).map((p) => p.name);

    // Default sort: deadline asc, nulls last.
    expect(await names({})).toEqual(["Villa Lake", "School Annex", "Office Tower", "Library"]);
    expect(await names({ status: ["ACTIVE"] })).toEqual(["School Annex", "Office Tower"]);
    expect(await names({ status: ["DONE", "ON_HOLD"] })).toEqual(["Villa Lake", "Library"]);
    expect(await names({ investorId: s.alpha.id })).toEqual(["Villa Lake", "School Annex"]);
    expect(await names({ year: 2025 })).toEqual(["Villa Lake", "Office Tower"]);
    expect(await names({ year: 2026 })).toEqual(["School Annex", "Office Tower"]);
    expect(await names({ year: 2027 })).toEqual(["Library"]);
    expect(await names({ year: 2024 })).toEqual([]);
    expect(await names({ year: 2026, status: ["ACTIVE"], investorId: s.beta.id })).toEqual(["Office Tower"]);
    expect(await names({ search: "beta" })).toEqual(["Office Tower", "Library"]);
    // Archived projects are excluded unless includeArchived, also under the year filter.
    await s.archiveProject(school.id);
    expect(await names({ year: 2026 })).toEqual(["Office Tower"]);
    expect(await names({ year: 2026, includeArchived: true })).toEqual(["School Annex", "Office Tower"]);
    // Year filter values (AN-000h): contract dates and project deadlines, descending.
    expect(value(await s.getAvailableYears())).toEqual([2027, 2026, 2025]);
  });

  it("TC-M2-025 archiving an investor does not archive its projects (BR-GEN-005)", async () => {
    const s = await withInvestors();
    const villa = value(await s.createProject({ name: "Villa Lake", investorId: s.alpha.id }));
    const school = value(await s.createProject({ name: "School Annex", investorId: s.alpha.id }));

    await s.archiveInvestor(s.alpha.id);

    expect((await s.projectRepo.get(villa.id))?.archivedAt).toBeNull();
    expect((await s.projectRepo.get(school.id))?.archivedAt).toBeNull();
    expect(value(await s.listProjects({ investorId: s.alpha.id })).map((p) => p.id)).toEqual([school.id, villa.id]);
    // BR-GEN-008: restoring a child whose parent is archived is allowed.
    await s.archiveProject(villa.id);
    expect(await s.restoreProject(villa.id)).toEqual({ ok: true, value: undefined });
    expect((await s.projectRepo.get(villa.id))?.archivedAt).toBeNull();
  });
});
