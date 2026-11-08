// Spec: AR-005, DM-040
import type { Contract } from "../../domain/Contract";
import { ok, type Result } from "../../domain/Result";
import type { ContractRepository } from "../../ports/ContractRepository";

/** Returns the contract, or null when no contract has this id. */
export type GetContract = (id: string) => Promise<Result<Contract | null>>;

export function makeGetContract({ contractRepo }: { contractRepo: ContractRepository }): GetContract {
  return async (id) => ok(await contractRepo.get(id));
}
