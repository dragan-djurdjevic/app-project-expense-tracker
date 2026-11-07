// Spec: AR-004, DM-040
import type { Contract, ContractFields, ContractType } from "../domain/Contract";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface ContractListFilter extends BaseListFilter {
  projectId?: string;
  type?: ContractType;
  subcontractorId?: string;
}

export type ContractRepository = EntityRepository<Contract, ContractFields, ContractListFilter>;
