// Spec: DM-040, BR-CON-001, BR-CON-002, BR-CON-004, BR-CON-005, BR-GEN-004, BR-GEN-005, BR-GEN-006, BR-GEN-008, UI-040, UI-032, AR-004
import { describe, expect, it } from "vitest";
import type { ContractInput } from "../../src/core/domain/Contract";
import { setupServices, value } from "../fixtures/services";

const UNKNOWN_ID = "99999999-0000-4000-8000-000000000000";

async function withParents() {
  const s = await setupServices();
  const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
  const beta = value(await s.createInvestor({ name: "Beta Holding", vatNumber: "BETA001" }));
  const struct = value(await s.createSubcontractor({ name: "Struct Eng", vatNumber: "STRUCT01" }));
  const hvac = value(await s.createSubcontractor({ name: "HVAC Pro", vatNumber: "HVAC01" }));
  const villa = value(await s.createProject({ name: "Villa Lake", investorId: alpha.id }));
  const tower = value(await s.createProject({ name: "Office Tower", investorId: beta.id }));
  const incoming = (input: Partial<ContractInput> = {}): ContractInput => ({
    type: "INCOMING",
    projectId: villa.id,
    subcontractorId: null,
    number: "V-001",
    date: "2025-02-10",
    value: 10_000_000,
    description: null,
    ...input,
  });
  const outgoing = (input: Partial<ContractInput> = {}): ContractInput => ({
    type: "OUTGOING",
    projectId: villa.id,
    subcontractorId: struct.id,
    number: "V-OUT-1",
    date: "2025-03-15",
    value: 3_000_000,
    description: null,
    ...input,
  });
  return { ...s, alpha, beta, struct, hvac, villa, tower, incoming, outgoing };
}

describe("contracts on SQLite (DM-040)", () => {
  it("TC-M3-004 OUTGOING contract with archived subcontractor returns BR-GEN-006", async () => {
    const s = await withParents();
    await s.archiveSubcontractor(s.struct.id);

    expect(await s.createContract(s.outgoing())).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "subcontractorId" },
    });
    expect(await s.createContract(s.outgoing({ subcontractorId: UNKNOWN_ID }))).toEqual({
      ok: false,
      error: { code: "BR-CON-002", messageKey: "errors.notFound", field: "subcontractorId" },
    });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM contract")).toEqual([{ n: 0 }]);
  });

  it("TC-M3-005 contract on archived project returns BR-GEN-006", async () => {
    const s = await withParents();
    await s.archiveProject(s.villa.id);

    expect(await s.createContract(s.incoming())).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "projectId" },
    });
    expect(await s.createContract(s.outgoing())).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "projectId" },
    });
    expect(await s.createContract(s.incoming({ projectId: UNKNOWN_ID }))).toEqual({
      ok: false,
      error: { code: "BR-CON-001", messageKey: "errors.notFound", field: "projectId" },
    });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM contract")).toEqual([{ n: 0 }]);
  });

  it("TC-M3-006 duplicate number in the same project (case-insensitive, incl. archived) returns BR-CON-004; another project is ok", async () => {
    const s = await withParents();
    const first = value(await s.createContract(s.incoming({ number: "V-001" })));
    await s.archiveContract(first.id);
    const duplicate = {
      ok: false,
      error: { code: "BR-CON-004", messageKey: "errors.contract.numberDuplicate", field: "number" },
    };

    expect(await s.createContract(s.incoming({ number: "v-001" }))).toEqual(duplicate);
    expect(await s.createContract(s.outgoing({ number: " V-001 " }))).toEqual(duplicate);
    const other = await s.createContract(s.incoming({ projectId: s.tower.id, number: "v-001" }));
    expect(other).toMatchObject({ ok: true, value: { projectId: s.tower.id, number: "v-001" } });

    // On update: another contract's number conflicts; keeping its own number (any case) does not.
    const second = value(await s.createContract(s.incoming({ number: "V-002" })));
    expect(await s.updateContract(second.id, s.incoming({ number: "V-001" }))).toEqual(duplicate);
    expect(await s.updateContract(second.id, s.incoming({ number: "v-002" }))).toMatchObject({
      ok: true,
      value: { number: "v-002" },
    });
  });

  it("TC-M3-008 update of value, date, description, number and subcontractor (OUTGOING) persists and changes updatedAt", async () => {
    const s = await withParents();
    const contract = value(await s.createContract(s.outgoing()));
    s.clock.set("2026-06-01T00:00:00.000Z");

    const updated = await s.updateContract(
      contract.id,
      s.outgoing({
        number: "V-OUT-2",
        date: "2025-04-01",
        value: 3_500_000,
        description: " Structural design ",
        subcontractorId: s.hvac.id,
      }),
    );

    const expected = {
      ...contract,
      number: "V-OUT-2",
      date: "2025-04-01",
      value: 3_500_000,
      description: "Structural design",
      subcontractorId: s.hvac.id,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z",
    };
    expect(updated).toEqual({ ok: true, value: expected });
    expect(await s.contractRepo.get(contract.id)).toEqual(expected);

    // A subcontractor archived after creation stays valid while unchanged (BR-GEN-006) ...
    await s.archiveSubcontractor(s.hvac.id);
    expect(await s.updateContract(contract.id, s.outgoing({ subcontractorId: s.hvac.id, value: 1 }))).toMatchObject({
      ok: true,
      value: { subcontractorId: s.hvac.id, value: 1 },
    });
    // ... but cannot be newly selected: switch to struct, then back to the archived hvac.
    value(await s.updateContract(contract.id, s.outgoing({ subcontractorId: s.struct.id })));
    expect(await s.updateContract(contract.id, s.outgoing({ subcontractorId: s.hvac.id }))).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "subcontractorId" },
    });
  });

  it("TC-M3-009 list filters projectId, type, subcontractorId; search by counter-party name; default sort date desc", async () => {
    const s = await withParents();
    value(await s.createContract(s.incoming({ number: "V-001", date: "2025-02-10" })));
    value(await s.createContract(s.outgoing({ number: "V-OUT-1", date: "2025-03-15" })));
    value(await s.createContract(s.outgoing({ number: "v-out-0", date: "2025-03-15", subcontractorId: s.hvac.id })));
    value(
      await s.createContract(
        s.incoming({ projectId: s.tower.id, number: "T-001", date: "2026-01-20", description: "Main design" }),
      ),
    );
    value(
      await s.createContract(
        s.outgoing({ projectId: s.tower.id, number: "T-OUT-1", date: "2024-12-01", subcontractorId: s.hvac.id }),
      ),
    );
    const numbers = async (filter: Parameters<typeof s.listContracts>[0]) =>
      value(await s.listContracts(filter)).map((c) => c.number);

    // Date desc, then number asc (case-insensitive), then id.
    expect(await numbers({})).toEqual(["T-001", "v-out-0", "V-OUT-1", "V-001", "T-OUT-1"]);
    expect(await numbers({ projectId: s.villa.id })).toEqual(["v-out-0", "V-OUT-1", "V-001"]);
    expect(await numbers({ type: "OUTGOING" })).toEqual(["v-out-0", "V-OUT-1", "T-OUT-1"]);
    expect(await numbers({ type: "INCOMING", projectId: s.tower.id })).toEqual(["T-001"]);
    expect(await numbers({ subcontractorId: s.hvac.id })).toEqual(["v-out-0", "T-OUT-1"]);
    // Search: counter-party name (subcontractor for OUTGOING, project's investor for INCOMING), number, project name,
    // description; case-insensitive contains.
    expect(await numbers({ search: "hvac" })).toEqual(["v-out-0", "T-OUT-1"]);
    expect(await numbers({ search: "BETA" })).toEqual(["T-001"]);
    expect(await numbers({ search: "alpha" })).toEqual(["V-001"]);
    expect(await numbers({ search: "out-1" })).toEqual(["V-OUT-1", "T-OUT-1"]);
    expect(await numbers({ search: "tower" })).toEqual(["T-001", "T-OUT-1"]);
    expect(await numbers({ search: "design" })).toEqual(["T-001"]);
    expect(await numbers({ search: "nothing" })).toEqual([]);
  });

  it("TC-M3-010 list returns counter-party = project's investor name for INCOMING and subcontractor name for OUTGOING", async () => {
    const s = await withParents();
    const inc = value(await s.createContract(s.incoming()));
    const out = value(await s.createContract(s.outgoing()));
    const towerIn = value(await s.createContract(s.incoming({ projectId: s.tower.id, number: "T-001" })));
    // Archived parents keep their names in the list.
    await s.archiveInvestor(s.alpha.id);
    await s.archiveSubcontractor(s.struct.id);

    const items = value(await s.listContracts({}));
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get(inc.id)).toEqual({
      ...inc,
      projectName: "Villa Lake",
      counterpartyName: "Alpha Invest",
      invoiced: 0,
      paid: 0,
    });
    expect(byId.get(out.id)).toMatchObject({ projectName: "Villa Lake", counterpartyName: "Struct Eng" });
    expect(byId.get(towerIn.id)).toMatchObject({ projectName: "Office Tower", counterpartyName: "Beta Holding" });

    // Invoiced = Σ non-cancelled, Paid = Σ PAID, archived invoices included (UI-040); invoice rows inserted directly
    // (invoices arrive in M4).
    const ts = "2026-01-01T00:00:00.000Z";
    await s.db.execute(
      `INSERT INTO invoice (id, number, contract_id, value, vat_rate, date, status, created_at, updated_at, archived_at)
       VALUES ('i1', 'I-1', ?, 100, 2000, '2025-03-01', 'DRAFT', ?, ?, NULL),
              ('i2', 'I-2', ?, 200, 2000, '2025-03-01', 'ISSUED', ?, ?, NULL),
              ('i3', 'I-3', ?, 400, 2000, '2025-03-01', 'PAID', ?, ?, NULL),
              ('i4', 'I-4', ?, 800, 2000, '2025-03-01', 'PAID', ?, ?, ?),
              ('i5', 'I-5', ?, 1600, 2000, '2025-03-01', 'CANCELLED', ?, ?, NULL)`,
      [inc.id, ts, ts, inc.id, ts, ts, inc.id, ts, ts, inc.id, ts, ts, ts, inc.id, ts, ts],
    );
    expect(value(await s.listContracts({ projectId: s.villa.id, type: "INCOMING" }))).toMatchObject([
      { id: inc.id, invoiced: 1500, paid: 1200 },
    ]);
  });

  it("TC-M3-011 archive and restore a contract; archiving a project does not archive its contracts", async () => {
    const s = await withParents();
    const contract = value(await s.createContract(s.incoming()));
    s.clock.set("2026-02-01T00:00:00.000Z");

    expect(await s.archiveContract(contract.id)).toEqual({ ok: true, value: undefined });
    expect(await s.contractRepo.get(contract.id)).toMatchObject({
      archivedAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
    expect(value(await s.listContracts({}))).toEqual([]);
    expect(value(await s.listContracts({ includeArchived: true })).map((c) => c.id)).toEqual([contract.id]);
    // Archived contracts are read-only (BR-GEN-007); archiving again is a no-op success (BR-GEN-004).
    expect(await s.updateContract(contract.id, s.incoming({ value: 1 }))).toEqual({
      ok: false,
      error: { code: "BR-GEN-007", messageKey: "errors.archivedReadOnly" },
    });
    s.clock.set("2026-02-15T00:00:00.000Z");
    expect(await s.archiveContract(contract.id)).toEqual({ ok: true, value: undefined });
    expect(await s.contractRepo.get(contract.id)).toMatchObject({ archivedAt: "2026-02-01T00:00:00.000Z" });

    s.clock.set("2026-03-01T00:00:00.000Z");
    expect(await s.restoreContract(contract.id)).toEqual({ ok: true, value: undefined });
    expect(await s.contractRepo.get(contract.id)).toMatchObject({
      archivedAt: null,
      updatedAt: "2026-03-01T00:00:00.000Z",
    });

    // BR-GEN-005: archiving the project keeps its contracts active; BR-GEN-008: a contract of the archived project
    // can be restored, and it can still be updated (existing reference stays valid, BR-GEN-006).
    const other = value(await s.createContract(s.incoming({ number: "V-002" })));
    await s.archiveContract(other.id);
    await s.archiveProject(s.villa.id);
    expect(await s.contractRepo.get(contract.id)).toMatchObject({ archivedAt: null });
    expect(await s.restoreContract(other.id)).toEqual({ ok: true, value: undefined });
    expect(await s.contractRepo.get(other.id)).toMatchObject({ archivedAt: null });
    expect(await s.updateContract(contract.id, s.incoming({ value: 5 }))).toMatchObject({
      ok: true,
      value: { value: 5 },
    });
    await expect(s.archiveContract(UNKNOWN_ID)).rejects.toThrow();
  });

  it("TC-M3-012 project detail summary: contracted = Σ INCOMING, contracted to subcontractors = Σ OUTGOING (archived included)", async () => {
    const s = await withParents();
    value(await s.createContract(s.incoming({ number: "V-001", value: 10_000_000 })));
    const archivedIn = value(await s.createContract(s.incoming({ number: "V-002", value: 500_000 })));
    value(await s.createContract(s.outgoing({ number: "V-OUT-1", value: 3_000_000 })));
    const archivedOut = value(
      await s.createContract(s.outgoing({ number: "V-OUT-2", value: 200_000, subcontractorId: s.hvac.id })),
    );
    value(await s.createContract(s.incoming({ projectId: s.tower.id, number: "T-001", value: 7 })));
    await s.archiveContract(archivedIn.id);
    await s.archiveContract(archivedOut.id);

    expect(value(await s.getProject(s.villa.id))?.summary).toEqual({
      contracted: 10_500_000,
      collected: 0,
      contractedOut: 3_200_000,
      paidOut: 0,
      net: 0,
    });
    expect(value(await s.getProject(s.tower.id))?.summary).toEqual({
      contracted: 7,
      collected: 0,
      contractedOut: 0,
      paidOut: 0,
      net: 0,
    });
  });
});
