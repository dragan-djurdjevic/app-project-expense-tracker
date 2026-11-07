// Spec: DM-000, DM-010, BR-GEN-002, BR-GEN-003, BR-GEN-007
import { describe, expect, it } from "vitest";
import { makeArchiveInvestor } from "../../../src/core/usecases/investor/archiveInvestor";
import { makeCreateInvestor } from "../../../src/core/usecases/investor/createInvestor";
import { makeUpdateInvestor } from "../../../src/core/usecases/investor/updateInvestor";
import { controlledClock } from "../../fixtures/controlledClock";
import { sequentialIds } from "../../fixtures/fixedClock";
import { InMemoryInvestorRepository } from "./InMemoryInvestorRepository";

function setup() {
  const clock = controlledClock("2026-03-01T10:00:00.000Z");
  const investorRepo = new InMemoryInvestorRepository(clock);
  const ids = sequentialIds();
  return {
    clock,
    investorRepo,
    createInvestor: makeCreateInvestor({ investorRepo, clock, ids }),
    updateInvestor: makeUpdateInvestor({ investorRepo, clock }),
    archiveInvestor: makeArchiveInvestor({ investorRepo }),
  };
}

describe("investor use cases (DM-010)", () => {
  it("TC-M2-001 createInvestor with valid data returns entity with id, timestamps from Clock, archivedAt null", async () => {
    const { createInvestor, investorRepo } = setup();

    const result = await createInvestor({
      name: "  Alpha Invest ",
      vatNumber: " alpha001 ",
      contactPerson: "Ana Alpha",
      email: "ana@alpha.example",
      phone: "",
    });

    const expected = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Alpha Invest",
      vatNumber: "ALPHA001",
      contactPerson: "Ana Alpha",
      email: "ana@alpha.example",
      phone: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
      archivedAt: null,
    };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await investorRepo.get(expected.id)).toEqual(expected);
  });

  it("TC-M2-002 createInvestor without name / without VAT returns BR-GEN-002 on name / vatNumber", async () => {
    const { createInvestor, investorRepo } = setup();

    expect(await createInvestor({ name: "   ", vatNumber: "ALPHA001" })).toEqual({
      ok: false,
      error: { code: "BR-GEN-002", messageKey: "errors.required", field: "name" },
    });
    expect(await createInvestor({ name: "Alpha Invest", vatNumber: "" })).toEqual({
      ok: false,
      error: { code: "BR-GEN-002", messageKey: "errors.required", field: "vatNumber" },
    });
    expect(investorRepo.rows.size).toBe(0);
  });

  it("TC-M2-003 createInvestor with invalid email returns an error on email", async () => {
    const { createInvestor, investorRepo } = setup();

    expect(await createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001", email: "a@b" })).toEqual({
      ok: false,
      error: { code: "BR-GEN-003", messageKey: "errors.format", field: "email" },
    });
    expect(investorRepo.rows.size).toBe(0);
  });

  it("TC-M2-008 update on an archived investor returns BR-GEN-007", async () => {
    const { createInvestor, updateInvestor, archiveInvestor, investorRepo } = setup();
    const created = await createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" });
    if (!created.ok) throw new Error("create failed");
    await archiveInvestor(created.value.id);
    const archived = await investorRepo.get(created.value.id);

    const result = await updateInvestor(created.value.id, { name: "Renamed", vatNumber: "ALPHA001" });

    expect(result).toEqual({ ok: false, error: { code: "BR-GEN-007", messageKey: "errors.archivedReadOnly" } });
    expect(await investorRepo.get(created.value.id)).toEqual(archived);
  });
});
