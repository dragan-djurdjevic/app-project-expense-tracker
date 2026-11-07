// Spec: AR-005, DM-000, DM-010, BR-GEN-002, BR-GEN-003, BR-GEN-007, BR-INV-001
import { archivedReadOnlyError, isArchived } from "../../domain/Archive";
import {
  investorVatDuplicateError,
  validateInvestorInput,
  type Investor,
  type InvestorInput,
} from "../../domain/Investor";
import { err, ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { InvestorRepository } from "../../ports/InvestorRepository";

export type UpdateInvestor = (id: string, input: InvestorInput) => Promise<Result<Investor>>;

export function makeUpdateInvestor({
  investorRepo,
  clock,
}: {
  investorRepo: InvestorRepository;
  clock: Clock;
}): UpdateInvestor {
  return async (id, input) => {
    const existing = await investorRepo.get(id);
    if (!existing) throw new Error(`Investor not found: ${id}`);
    if (isArchived(existing)) return err(archivedReadOnlyError());
    const fields = validateInvestorInput(input);
    if (!fields.ok) return fields;
    if (await investorRepo.existsByVat(fields.value.vatNumber, id)) {
      return err(investorVatDuplicateError());
    }
    return ok(await investorRepo.update(id, { ...fields.value, updatedAt: clock.now().toISOString() }));
  };
}
