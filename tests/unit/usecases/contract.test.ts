// Spec: DM-040, AR-005, BR-CON-002, BR-CON-003, BR-CON-005
import { describe, expect, it } from "vitest";
import type { ContractInput } from "../../../src/core/domain/Contract";
import { makeCreateContract } from "../../../src/core/usecases/contract/createContract";
import { makeUpdateContract } from "../../../src/core/usecases/contract/updateContract";
import { controlledClock } from "../../fixtures/controlledClock";
import { sequentialIds } from "../../fixtures/fixedClock";
import {
  InMemoryContractRepository,
  InMemoryProjectRepository,
  InMemorySubcontractorRepository,
} from "./InMemoryContractRepositories";

const TS = "2026-01-01T00:00:00.000Z";
const PROJECT_ID = "30000000-0000-4000-8000-000000000001";
const OTHER_PROJECT_ID = "30000000-0000-4000-8000-000000000002";
const SUBCONTRACTOR_ID = "20000000-0000-4000-8000-000000000001";

async function setup() {
  const clock = controlledClock("2026-03-01T10:00:00.000Z");
  const ids = sequentialIds();
  const contractRepo = new InMemoryContractRepository(clock);
  const projectRepo = new InMemoryProjectRepository(clock);
  const subcontractorRepo = new InMemorySubcontractorRepository(clock);
  for (const [id, name] of [
    [PROJECT_ID, "Villa Lake"],
    [OTHER_PROJECT_ID, "Office Tower"],
  ]) {
    await projectRepo.create({
      id,
      name,
      deadline: null,
      status: "ACTIVE",
      budget: null,
      investorId: "10000000-0000-4000-8000-000000000001",
      createdAt: TS,
      updatedAt: TS,
      archivedAt: null,
    });
  }
  await subcontractorRepo.create({
    id: SUBCONTRACTOR_ID,
    name: "Struct Eng",
    vatNumber: "STRUCT01",
    contactPerson: null,
    email: null,
    phone: null,
    industry: null,
    createdAt: TS,
    updatedAt: TS,
    archivedAt: null,
  });
  return {
    clock,
    contractRepo,
    createContract: makeCreateContract({ contractRepo, projectRepo, subcontractorRepo, clock, ids }),
    updateContract: makeUpdateContract({ contractRepo, subcontractorRepo, clock }),
  };
}

const incoming: ContractInput = {
  type: "INCOMING",
  projectId: PROJECT_ID,
  subcontractorId: null,
  number: " V-001 ",
  date: "2025-02-10",
  value: 10_000_000,
  description: "  ",
};

describe("contract use cases (DM-040)", () => {
  it("TC-M3-001 INCOMING contract without subcontractor is created", async () => {
    const { createContract, contractRepo } = await setup();

    const result = await createContract(incoming);

    const expected = {
      id: "00000000-0000-4000-8000-000000000001",
      number: "V-001",
      type: "INCOMING",
      projectId: PROJECT_ID,
      subcontractorId: null,
      value: 10_000_000,
      date: "2025-02-10",
      description: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
      archivedAt: null,
    };
    expect(result).toEqual({ ok: true, value: expected });
    expect(await contractRepo.get(expected.id)).toEqual(expected);
  });

  it("TC-M3-002 INCOMING contract with subcontractorId returns BR-CON-003", async () => {
    const { createContract, contractRepo } = await setup();

    expect(await createContract({ ...incoming, subcontractorId: SUBCONTRACTOR_ID })).toEqual({
      ok: false,
      error: { code: "BR-CON-003", messageKey: "errors.contract.subcontractorForbidden", field: "subcontractorId" },
    });
    expect(contractRepo.rows.size).toBe(0);
  });

  it("TC-M3-003 OUTGOING contract without subcontractorId returns BR-CON-002 on field subcontractorId", async () => {
    const { createContract, contractRepo } = await setup();

    for (const subcontractorId of [null, undefined, "  "]) {
      expect(await createContract({ ...incoming, type: "OUTGOING", subcontractorId })).toEqual({
        ok: false,
        error: { code: "BR-CON-002", messageKey: "errors.contract.subcontractorRequired", field: "subcontractorId" },
      });
    }
    // Field order (AR-005): subcontractorId is checked before number.
    expect(await createContract({ ...incoming, type: "OUTGOING", subcontractorId: null, number: "" })).toEqual({
      ok: false,
      error: { code: "BR-CON-002", messageKey: "errors.contract.subcontractorRequired", field: "subcontractorId" },
    });
    expect(contractRepo.rows.size).toBe(0);
  });

  it("TC-M3-007 update attempting to change type or projectId returns BR-CON-005", async () => {
    const { createContract, updateContract, contractRepo } = await setup();
    const created = await createContract(incoming);
    if (!created.ok) throw new Error("setup failed");
    const contract = created.value;

    expect(
      await updateContract(contract.id, { ...incoming, type: "OUTGOING", subcontractorId: SUBCONTRACTOR_ID }),
    ).toEqual({
      ok: false,
      error: { code: "BR-CON-005", messageKey: "errors.immutable", field: "type" },
    });
    expect(await updateContract(contract.id, { ...incoming, projectId: OTHER_PROJECT_ID })).toEqual({
      ok: false,
      error: { code: "BR-CON-005", messageKey: "errors.immutable", field: "projectId" },
    });
    // Both changed → the first in order type, projectId.
    expect(
      await updateContract(contract.id, {
        ...incoming,
        type: "OUTGOING",
        projectId: OTHER_PROJECT_ID,
        subcontractorId: SUBCONTRACTOR_ID,
      }),
    ).toEqual({
      ok: false,
      error: { code: "BR-CON-005", messageKey: "errors.immutable", field: "type" },
    });
    expect(await contractRepo.get(contract.id)).toEqual(contract);
  });
});
