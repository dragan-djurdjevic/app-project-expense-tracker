// Spec: AR-005, BR-GEN-004, BR-GEN-008
import { isArchived } from "../../domain/Archive";
import { ok, type Result } from "../../domain/Result";
import type { ContractRepository } from "../../ports/ContractRepository";

export type RestoreContract = (id: string) => Promise<Result<void>>;

/** Clears archivedAt, also when its project or subcontractor is archived (BR-GEN-008); no-op for active contracts. */
export function makeRestoreContract({ contractRepo }: { contractRepo: ContractRepository }): RestoreContract {
  return async (id) => {
    const existing = await contractRepo.get(id);
    if (!existing) throw new Error(`Contract not found: ${id}`);
    if (isArchived(existing)) await contractRepo.restore(id);
    return ok(undefined);
  };
}
