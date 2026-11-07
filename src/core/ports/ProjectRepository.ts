// Spec: AR-004, DM-030, AN-3
import type { Project, ProjectFields, ProjectStatus } from "../domain/Project";
import type { BaseListFilter, EntityRepository } from "./EntityRepository";

export interface ProjectListFilter extends BaseListFilter {
  investorId?: string;
  status?: ProjectStatus[];
  /** AN-3 rule: deadline in year or any contract dated in year. */
  year?: number;
}

export type ProjectRepository = EntityRepository<Project, ProjectFields, ProjectListFilter>;
