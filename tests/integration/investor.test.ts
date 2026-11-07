// Spec: DM-000, DM-010, BR-INV-001, BR-GEN-004, BR-GEN-005, UI-010, UI-002a
import { describe, expect, it } from "vitest";
import { setupServices, value } from "../fixtures/services";

const DUPLICATE = { ok: false, error: { code: "BR-INV-001", messageKey: "errors.vat.duplicate", field: "vatNumber" } };

describe("investors on SQLite (DM-010)", () => {
  it("TC-M2-004 duplicate investor VAT (also vs archived, also different case) returns BR-INV-001", async () => {
    const s = await setupServices();
    const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "AB1" }));

    expect(await s.createInvestor({ name: "Other", vatNumber: "AB1" })).toEqual(DUPLICATE);
    expect(await s.createInvestor({ name: "Other", vatNumber: "ab1" })).toEqual(DUPLICATE);

    await s.archiveInvestor(alpha.id);
    expect(await s.createInvestor({ name: "Other", vatNumber: "ab1" })).toEqual(DUPLICATE);

    const beta = value(await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" }));
    expect(await s.updateInvestor(beta.id, { name: "Beta Holding", vatNumber: "ab1" })).toEqual(DUPLICATE);
    expect(await s.db.select("SELECT vat_number FROM investor ORDER BY vat_number")).toEqual([
      { vat_number: "AB1" },
      { vat_number: "BETA001" },
    ]);
  });

  it("TC-M2-005 updateInvestor changes fields and updatedAt, keeps createdAt; same VAT is no false duplicate", async () => {
    const s = await setupServices();
    const created = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
    s.clock.set("2026-02-01T12:00:00.000Z");

    const result = await s.updateInvestor(created.id, {
      name: "Alpha Invest Ltd",
      vatNumber: "alpha001",
      contactPerson: "Ana",
      email: "ana@alpha.example",
      phone: "+381 11 123",
    });

    const expected = {
      id: created.id,
      name: "Alpha Invest Ltd",
      vatNumber: "ALPHA001",
      contactPerson: "Ana",
      email: "ana@alpha.example",
      phone: "+381 11 123",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T12:00:00.000Z",
      archivedAt: null,
    };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await s.investorRepo.get(created.id)).toEqual(expected);
  });

  it("TC-M2-006 archiveInvestor sets archivedAt; list excludes it by default and includes it with includeArchived", async () => {
    const s = await setupServices();
    const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
    const beta = value(await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" }));
    s.clock.set("2026-03-01T08:00:00.000Z");

    expect(await s.archiveInvestor(alpha.id)).toEqual({ ok: true, value: undefined });

    const archived = await s.investorRepo.get(alpha.id);
    expect(archived?.archivedAt).toBe("2026-03-01T08:00:00.000Z");
    expect(archived?.updatedAt).toBe("2026-03-01T08:00:00.000Z");
    expect(value(await s.listInvestors()).map((i) => i.id)).toEqual([beta.id]);
    expect(value(await s.listInvestors({ includeArchived: true })).map((i) => i.id)).toEqual([alpha.id, beta.id]);

    // BR-GEN-004: archiving an already archived record is a no-op success.
    s.clock.set("2026-04-01T08:00:00.000Z");
    expect(await s.archiveInvestor(alpha.id)).toEqual({ ok: true, value: undefined });
    expect((await s.investorRepo.get(alpha.id))?.archivedAt).toBe("2026-03-01T08:00:00.000Z");
  });

  it("TC-M2-007 restoreInvestor clears archivedAt", async () => {
    const s = await setupServices();
    const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
    await s.archiveInvestor(alpha.id);
    s.clock.set("2026-05-01T09:30:00.000Z");

    expect(await s.restoreInvestor(alpha.id)).toEqual({ ok: true, value: undefined });

    const restored = await s.investorRepo.get(alpha.id);
    expect(restored?.archivedAt).toBeNull();
    expect(restored?.updatedAt).toBe("2026-05-01T09:30:00.000Z");
    expect(value(await s.listInvestors()).map((i) => i.id)).toEqual([alpha.id]);
  });

  it('TC-M2-009 investor list search "alp" matches name "Alpha Invest" and VAT; sorted by name', async () => {
    const s = await setupServices();
    await s.createInvestor({ name: "Zeta Group", vatNumber: "ZALP-01" });
    await s.createInvestor({ name: "Alpha Invest", vatNumber: "AI001" });
    await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" });
    await s.createInvestor({ name: "Gamma", vatNumber: "GAMMA01", contactPerson: "Ralph Alpine" });

    const names = value(await s.listInvestors({ search: "alp" })).map((i) => i.name);

    // "Alpha Invest" by name, "Zeta Group" by VAT ZALP-01, "Gamma" by contact person (UI-010 searchable columns).
    expect(names).toEqual(["Alpha Invest", "Gamma", "Zeta Group"]);
    expect(value(await s.listInvestors({ search: "ALP" })).map((i) => i.name)).toEqual(names);
    expect(value(await s.listInvestors()).map((i) => i.name)).toEqual([
      "Alpha Invest",
      "Beta Holding",
      "Gamma",
      "Zeta Group",
    ]);
  });

  it('TC-M2-026 investor list "Projects" count counts active projects only', async () => {
    const s = await setupServices();
    const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
    await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" });
    await s.createProject({ name: "Villa Lake", investorId: alpha.id });
    await s.createProject({ name: "Library", investorId: alpha.id, status: "CANCELLED" });
    const school = value(await s.createProject({ name: "School Annex", investorId: alpha.id }));
    await s.archiveProject(school.id);

    // "Active" = not archived (DM-000); status does not matter.
    const counts = value(await s.listInvestors()).map((i) => [i.name, i.projectCount]);

    expect(counts).toEqual([
      ["Alpha Invest", 2],
      ["Beta Holding", 0],
    ]);
  });
});
