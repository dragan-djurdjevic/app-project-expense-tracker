// Spec: AR-004, DM-030, AN-3, AN-000, UI-030
import type { Project, ProjectFields, ProjectStatus } from "../domain/Project";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface ProjectListFilter extends BaseListFilter {
  investorId?: string;
  status?: ProjectStatus[];
  /** AN-3 rule: deadline in year or any contract dated in year. */
  year?: number;
}

export interface ProjectRepository extends EntityRepository<Project, ProjectFields, ProjectListFilter> {
  /**
   * Distinct years of all contract dates, invoice dates and project deadlines, descending (AN-000h); may be
   * empty. Implemented here in M2 for the Projects Year filter (UI-030), reused by AnalyticsQuery in M5.
   */
  availableYears(): Promise<number[]>;
}
