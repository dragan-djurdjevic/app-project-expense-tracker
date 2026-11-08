// Spec: AR-004, DM-040, BR-CON-004, UI-040
import type { Contract, ContractFields, ContractListItem, ContractType } from "../domain/Contract";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface ContractListFilter extends BaseListFilter {
  projectId?: string;
  type?: ContractType;
  subcontractorId?: string;
}

export interface ContractRepository extends Omit<
  EntityRepository<Contract, ContractFields, ContractListFilter>,
  "list"
> {
  /**
   * Contracts with project name, counter-party name, invoiced and paid sums (UI-040). Search over number, project
   * name, counter-party name and description; sorted by date desc, number asc (case-insensitive), id.
   */
  list(filter: ContractListFilter): Promise<ContractListItem[]>;
  /** BR-CON-004: case-insensitive as SQLite `COLLATE NOCASE` (ASCII letters only); includes archived contracts. */
  existsByNumber(projectId: string, number: string, excludeId?: string): Promise<boolean>;
}
