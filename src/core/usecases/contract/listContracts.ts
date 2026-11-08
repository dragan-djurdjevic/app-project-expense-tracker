// Spec: AR-005, UI-040, UI-002a, BR-GEN-004
import type { ContractListItem } from "../../domain/Contract";
import { ok, type Result } from "../../domain/Result";
import type { ContractListFilter, ContractRepository } from "../../ports/ContractRepository";

export type ListContracts = (filter?: ContractListFilter) => Promise<Result<ContractListItem[]>>;

/** Lists contracts with project/counter-party names and invoiced/paid sums; date desc, number asc, id. */
export function makeListContracts({ contractRepo }: { contractRepo: ContractRepository }): ListContracts {
  return async (filter = {}) => ok(await contractRepo.list(filter));
}
