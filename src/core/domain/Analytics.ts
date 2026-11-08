// Spec: AN-000, AN-1, AN-2, AN-3, AN-4, AN-5
import type { DateOnly } from "./DateOnly";
import type { Money } from "./Money";
import type { Percent } from "./Percent";
import type { ProjectStatus } from "./Project";

/** Net = invoice.value; Gross = value + VAT (AN-000). */
export type AnalyticsMode = "NET" | "GROSS";

/** A calendar year or "ALL" (no year restriction; AN-1, AN-2, AN-4 only). */
export type YearSelection = number | "ALL";

interface ProjectRowBase {
  projectId: string;
  projectName: string;
  projectArchived: boolean;
}

/** AN-1 row. */
export interface ContractedVsCollectedRow extends ProjectRowBase {
  investorName: string;
  contracted: Money;
  collected: Money;
  /** True when the project has an INCOMING contract dated in the selected year. */
  contractedInYear: boolean;
}

/** AN-2 sub-row (per subcontractor). */
export interface SubcontractorPaymentSubRow {
  subcontractorId: string;
  subcontractorName: string;
  contractedOut: Money;
  paidOut: Money;
}

/** AN-2 row. */
export interface SubcontractorPaymentRow extends ProjectRowBase {
  contractedOut: Money;
  paidOut: Money;
  collected: Money;
  subcontractors: SubcontractorPaymentSubRow[];
}

/** AN-3 row. */
export interface ProjectInYearRow extends ProjectRowBase {
  investorName: string;
  status: ProjectStatus;
  deadline: DateOnly | null;
  budget: Money | null;
  contractedInYear: Money;
}

/** AN-4 row. */
export interface NetPerProjectRow extends ProjectRowBase {
  collected: Money;
  paidOut: Money;
}

/** AN-5 row. */
export interface BudgetRealisationRow extends ProjectRowBase {
  investorName: string;
  status: ProjectStatus;
  budget: Money | null;
  contracted: Money;
  invoiced: Money;
  collected: Money;
}

/** AN-1 report row; the percentage is computed from net values (AN-000c). */
export interface ContractedVsCollectedReportRow extends ContractedVsCollectedRow {
  collectedPercent: Percent;
}

/** AN-1 footer (AN-000e). */
export interface ContractedVsCollectedFooter {
  projectCount: number;
  /** Rows with an INCOMING contract dated in the selected year. */
  contractedInYearCount: number;
  contracted: Money;
  collected: Money;
  collectedPercent: Percent;
}

export interface ContractedVsCollectedReport {
  rows: ContractedVsCollectedReportRow[];
  footer: ContractedVsCollectedFooter;
}

/** AN-2 per-subcontractor sub-row; share = this subcontractor's paid ÷ the project's collected. */
export interface SubcontractorPaymentReportSubRow extends SubcontractorPaymentSubRow {
  paidPercent: Percent;
  sharePercent: Percent;
}

/** AN-2 columns shared by rows and the footer. */
export interface SubcontractorPaymentTotals {
  contractedOut: Money;
  paidOut: Money;
  /** Paid ÷ Contracted to subcontractors. */
  paidPercent: Percent;
  collected: Money;
  /** Paid ÷ Collected. */
  sharePercent: Percent;
  /** Collected − Paid. */
  retained: Money;
  /** Retained ÷ Collected. */
  retainedPercent: Percent;
}

/** AN-2 report row. */
export interface SubcontractorPaymentReportRow extends ProjectRowBase, SubcontractorPaymentTotals {
  subcontractors: SubcontractorPaymentReportSubRow[];
}

export interface SubcontractorPaymentReport {
  rows: SubcontractorPaymentReportRow[];
  footer: SubcontractorPaymentTotals;
}

/** AN-3 footer: Σ budget ignores nulls. */
export interface ProjectsInYearFooter {
  projectCount: number;
  budget: Money;
  contractedInYear: Money;
}

export interface ProjectsInYearReport {
  rows: ProjectInYearRow[];
  footer: ProjectsInYearFooter;
}

/** AN-4 columns shared by rows and the footer. */
export interface NetResultTotals {
  collected: Money;
  paidOut: Money;
  /** Collected − Paid. */
  net: Money;
  /** Net ÷ Collected, from net values. */
  marginPercent: Percent;
}

export interface NetResultReportRow extends ProjectRowBase, NetResultTotals {}

export interface NetResultReport {
  rows: NetResultReportRow[];
  footer: NetResultTotals;
}

/** AN-5 report row; percentages of budget are null for a null or 0 budget. */
export interface BudgetRealisationReportRow extends BudgetRealisationRow {
  contractedPercentOfBudget: Percent;
  realisationPercentOfBudget: Percent;
  realisationPercentOfContracted: Percent;
  /** Budget − Collected; null when the budget is null. */
  remaining: Money | null;
}

/** AN-5 footer. */
export interface BudgetRealisationFooter {
  /** Σ non-null budgets. */
  budget: Money;
  contracted: Money;
  invoiced: Money;
  collected: Money;
  /** Σ remaining budget of projects with a budget. */
  remaining: Money;
  contractedPercentOfBudget: Percent;
  realisationPercentOfBudget: Percent;
  realisationPercentOfContracted: Percent;
}

export interface BudgetRealisationReport {
  rows: BudgetRealisationReportRow[];
  footer: BudgetRealisationFooter;
}
