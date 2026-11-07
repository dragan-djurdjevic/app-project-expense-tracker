// Spec: AR-003, AR-004, AN-000, AN-1, AN-2, AN-3, AN-4, AN-5
import type {
  AnalyticsMode,
  BudgetRealisationRow,
  ContractedVsCollectedRow,
  NetPerProjectRow,
  ProjectInYearRow,
  SubcontractorPaymentRow,
  YearSelection,
} from "../domain/Analytics";
import type { ProjectStatus } from "../domain/Project";

export interface AnalyticsQuery {
  contractedVsCollected(year: YearSelection, mode: AnalyticsMode): Promise<ContractedVsCollectedRow[]>;
  subcontractorPayments(year: YearSelection, mode: AnalyticsMode): Promise<SubcontractorPaymentRow[]>;
  projectsInYear(year: number): Promise<ProjectInYearRow[]>;
  netPerProject(year: YearSelection, mode: AnalyticsMode): Promise<NetPerProjectRow[]>;
  budgetRealisation(statuses: ProjectStatus[]): Promise<BudgetRealisationRow[]>;
  availableYears(): Promise<number[]>;
}
