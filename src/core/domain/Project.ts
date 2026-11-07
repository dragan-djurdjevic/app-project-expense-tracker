// Spec: DM-030, DM-001, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-PRJ-001, UI-032
import { createDateOnly, type DateOnly } from "./DateOnly";
import { domainError, formatError, requiredError, type DomainError } from "./DomainError";
import type { Entity } from "./Entity";
import { createMoney, type Money } from "./Money";
import { err, ok, type Result } from "./Result";
import { requiredText } from "./Text";

export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "DONE", "CANCELLED"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DEFAULT_PROJECT_STATUS: ProjectStatus = "PLANNED";

export interface ProjectFields {
  name: string;
  deadline: DateOnly | null;
  status: ProjectStatus;
  budget: Money | null;
  investorId: string;
}

export interface Project extends Entity, ProjectFields {}

/** Project as shown in the Projects list (UI-030): with the investor's name. */
export interface ProjectListItem extends Project {
  investorName: string;
}

/** UI-032 summary cards (all years, net amounts). */
export interface ProjectSummary {
  contracted: Money;
  collected: Money;
  contractedOut: Money;
  paidOut: Money;
  /** collected − paidOut; may be negative. */
  net: number;
}

/** Project detail (UI-032): header data and summary cards. */
export interface ProjectDetails extends ProjectListItem {
  summary: ProjectSummary;
}

/** Raw form input for create/update (UI-031). */
export interface ProjectInput {
  name: string;
  investorId: string;
  /** Defaults to PLANNED when omitted (DM-030). */
  status?: string | null;
  deadline?: string | null;
  budget?: number | null;
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

/** BR-PRJ-001: `investorId` must reference an existing investor. */
export const investorNotFoundError = (): DomainError => domainError("BR-PRJ-001", "errors.notFound", "investorId");

/** Validates DM-030 field rules (the investor reference is checked by the use case); first error in form order. */
export function validateProjectInput(input: ProjectInput): Result<ProjectFields> {
  const name = requiredText(input.name, 200, "name");
  if (!name.ok) return name;
  const investorId = (input.investorId ?? "").trim();
  if (investorId === "") return err(requiredError("investorId"));
  const statusText = (input.status ?? "").trim();
  const status = statusText === "" ? DEFAULT_PROJECT_STATUS : statusText;
  if (!isProjectStatus(status)) return err(formatError("status"));
  let deadline: DateOnly | null = null;
  if (input.deadline !== null && input.deadline !== undefined && input.deadline.trim() !== "") {
    const parsed = createDateOnly(input.deadline, "deadline");
    if (!parsed.ok) return parsed;
    deadline = parsed.value;
  }
  let budget: Money | null = null;
  if (input.budget !== null && input.budget !== undefined) {
    const parsed = createMoney(input.budget, "budget");
    if (!parsed.ok) return parsed;
    budget = parsed.value;
  }
  return ok({ name: name.value, deadline, status, budget, investorId });
}
