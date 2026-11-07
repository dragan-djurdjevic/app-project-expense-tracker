// Spec: AR-005, DM-000, DM-010, BR-GEN-002, BR-GEN-003, BR-INV-001
import {
  investorVatDuplicateError,
  validateInvestorInput,
  type Investor,
  type InvestorInput,
} from "../../domain/Investor";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { IdGenerator } from "../../ports/IdGenerator";
import type { InvestorRepository } from "../../ports/InvestorRepository";

export type CreateInvestor = (input: InvestorInput) => Promise<Result<Investor>>;

export function makeCreateInvestor({
  investorRepo,
  clock,
  ids,
}: {
  investorRepo: InvestorRepository;
  clock: Clock;
  ids: IdGenerator;
}): CreateInvestor {
  return async (input) => {
    const fields = validateInvestorInput(input);
    if (!fields.ok) return fields;
    if (await investorRepo.existsByVat(fields.value.vatNumber)) {
      return err(investorVatDuplicateError());
    }
    const now = clock.now().toISOString();
    const investor: Investor = { id: ids.next(), ...fields.value, createdAt: now, updatedAt: now, archivedAt: null };
    return ok(await investorRepo.create(investor));
  };
}
