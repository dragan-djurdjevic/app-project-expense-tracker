// Spec: AR-004, DM-020
import type { Subcontractor, SubcontractorFields } from "../domain/Subcontractor";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export type SubcontractorListFilter = BaseListFilter;

export interface SubcontractorRepository extends EntityRepository<
  Subcontractor,
  SubcontractorFields,
  SubcontractorListFilter
> {
  existsByVat(vat: string, excludeId?: string): Promise<boolean>;
}
