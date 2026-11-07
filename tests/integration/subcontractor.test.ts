// Spec: DM-000, DM-020, BR-SUB-001, BR-GEN-004, BR-GEN-007, UI-020
import { describe, expect, it } from "vitest";
import { setupServices, value } from "../fixtures/services";

describe("subcontractors on SQLite (DM-020)", () => {
  it("TC-M2-010 subcontractor create/update/archive/restore round-trip incl. industry", async () => {
    const s = await setupServices();
    const created = value(
      await s.createSubcontractor({ name: "Struct Eng", vatNumber: "struct01", industry: " Structural engineering " }),
    );
    expect(created).toEqual({
      id: "00000000-0000-4000-8000-000000000001",
      name: "Struct Eng",
      vatNumber: "STRUCT01",
      industry: "Structural engineering",
      contactPerson: null,
      email: null,
      phone: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      archivedAt: null,
    });
    expect(await s.subcontractorRepo.get(created.id)).toEqual(created);

    s.clock.set("2026-02-01T00:00:00.000Z");
    const updated = value(
      await s.updateSubcontractor(created.id, {
        name: "Struct Eng d.o.o.",
        vatNumber: "STRUCT01",
        industry: "HVAC",
        contactPerson: "Petar",
        email: "petar@struct.example",
        phone: "011 222",
      }),
    );
    expect(updated).toEqual({
      ...created,
      name: "Struct Eng d.o.o.",
      industry: "HVAC",
      contactPerson: "Petar",
      email: "petar@struct.example",
      phone: "011 222",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(value(await s.listSubcontractors({ search: "hvac" })).map((x) => x.id)).toEqual([created.id]);

    s.clock.set("2026-03-01T00:00:00.000Z");
    await s.archiveSubcontractor(created.id);
    expect(await s.subcontractorRepo.get(created.id)).toEqual({
      ...updated,
      archivedAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    });
    expect(value(await s.listSubcontractors())).toEqual([]);
    expect(value(await s.listSubcontractors({ includeArchived: true })).map((x) => x.id)).toEqual([created.id]);
    expect(await s.updateSubcontractor(created.id, { name: "X", vatNumber: "STRUCT01" })).toEqual({
      ok: false,
      error: { code: "BR-GEN-007", messageKey: "errors.archivedReadOnly" },
    });

    s.clock.set("2026-04-01T00:00:00.000Z");
    await s.restoreSubcontractor(created.id);
    expect(value(await s.getSubcontractor(created.id))).toEqual({
      ...updated,
      archivedAt: null,
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
  });

  it("TC-M2-011 duplicate subcontractor VAT returns BR-SUB-001; same VAT as an existing investor is allowed", async () => {
    const s = await setupServices();
    await s.createInvestor({ name: "Alpha Invest", vatNumber: "SHARED01" });

    const sub = await s.createSubcontractor({ name: "Alpha Build", vatNumber: "shared01" });
    expect(sub.ok).toBe(true);

    expect(await s.createSubcontractor({ name: "Other", vatNumber: "SHARED01" })).toEqual({
      ok: false,
      error: { code: "BR-SUB-001", messageKey: "errors.vat.duplicate", field: "vatNumber" },
    });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM subcontractor")).toEqual([{ n: 1 }]);
  });
});
