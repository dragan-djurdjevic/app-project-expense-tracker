// Spec: AR-005, BR-GEN-004, BR-GEN-005
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { ContractRepository } from "../../ports/ContractRepository";

export type ArchiveContract = (id: string) => Promise<Result<void>>;

/** Sets archivedAt; archiving an archived contract is a no-op success. */
export function makeArchiveContract({ contractRepo }: { contractRepo: ContractRepository }): ArchiveContract {
  return async (id) => {
    const existing = await contractRepo.get(id);
    if (!existing) throw new Error(`Contract not found: ${id}`);
    if (!isArchived(existing)) await contractRepo.archive(id);
    return ok(undefined);
  };
}
