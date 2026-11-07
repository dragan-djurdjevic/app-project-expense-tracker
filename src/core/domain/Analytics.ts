// Spec: AN-000, AN-1, AN-2, AN-3, AN-4, AN-5
import type { DateOnly } from "./DateOnly";
import type { Money } from "./Money";
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
