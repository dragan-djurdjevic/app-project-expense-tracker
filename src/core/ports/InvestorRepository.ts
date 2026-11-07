// Spec: AR-004, DM-010
import type { Investor, InvestorFields } from "../domain/Investor";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export type InvestorListFilter = BaseListFilter;

export interface InvestorRepository extends EntityRepository<Investor, InvestorFields, InvestorListFilter> {
  existsByVat(vat: string, excludeId?: string): Promise<boolean>;
}
