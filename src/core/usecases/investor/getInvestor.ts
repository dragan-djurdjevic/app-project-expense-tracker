// Spec: AR-005, DM-010
import type { Investor } from "../../domain/Investor";
import { ok, type Result } from "../../domain/Result";
import type { InvestorRepository } from "../../ports/InvestorRepository";

/** Returns the investor, or null when no investor has this id. */
export type GetInvestor = (id: string) => Promise<Result<Investor | null>>;

export function makeGetInvestor({ investorRepo }: { investorRepo: InvestorRepository }): GetInvestor {
  return async (id) => ok(await investorRepo.get(id));
}
