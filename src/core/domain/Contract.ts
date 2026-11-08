// Spec: DM-040, DM-001, AR-004, AR-005, BR-GEN-001, BR-GEN-002, BR-GEN-003, BR-CON-001, BR-CON-002, BR-CON-003, BR-CON-004, BR-CON-005, UI-040
import { createDateOnly, type DateOnly } from "./DateOnly";
import { domainError, formatError, requiredError, type DomainError } from "./DomainError";
import type { Entity } from "./Entity";
import { createMoney, type Money } from "./Money";
import { err, ok, type Result } from "./Result";
import { optionalText, requiredText } from "./Text";

export const CONTRACT_TYPES = ["INCOMING", "OUTGOING"] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

export interface ContractFields {
  number: string;
  type: ContractType;
  projectId: string;
  subcontractorId: string | null;
  value: Money;
  date: DateOnly;
  description: string | null;
}

export interface Contract extends Entity, ContractFields {}

/** Contract as shown in the Contracts list (UI-040, AR-004). */
export interface ContractListItem extends Contract {
  projectName: string;
  /** Project's investor name for INCOMING, subcontractor name for OUTGOING. */
  counterpartyName: string;
  /** Σ net values of non-cancelled invoices (archived invoices included). */
  invoiced: Money;
  /** Σ net values of PAID invoices (archived invoices included). */
  paid: Money;
}

/**
 * Raw form input for create and update (UI-041); update input has the same shape (BR-CON-005).
 * `value` null = empty input (BR-GEN-002); a non-integer or NaN value is invalid (BR-GEN-001).
 */
export interface ContractInput {
  type: string;
  projectId: string;
  subcontractorId?: string | null;
  number: string;
  date: string;
  value: number | null;
  description?: string | null;
}

export function isContractType(value: string): value is ContractType {
  return (CONTRACT_TYPES as readonly string[]).includes(value);
}

/** BR-CON-001: unknown project. */
export const projectNotFoundError = (): DomainError => domainError("BR-CON-001", "errors.notFound", "projectId");
/** BR-CON-002: OUTGOING without subcontractor. */
export const subcontractorRequiredError = (): DomainError =>
  domainError("BR-CON-002", "errors.contract.subcontractorRequired", "subcontractorId");
/** BR-CON-002: unknown subcontractor. */
export const subcontractorNotFoundError = (): DomainError =>
  domainError("BR-CON-002", "errors.notFound", "subcontractorId");
/** BR-CON-003: INCOMING with subcontractor. */
export const subcontractorForbiddenError = (): DomainError =>
  domainError("BR-CON-003", "errors.contract.subcontractorForbidden", "subcontractorId");
/** BR-CON-004: number already used in the project. */
export const contractNumberDuplicateError = (): DomainError =>
  domainError("BR-CON-004", "errors.contract.numberDuplicate", "number");
/** BR-CON-005: type / projectId changed on update. */
export const contractImmutableError = (field: "type" | "projectId"): DomainError =>
  domainError("BR-CON-005", "errors.immutable", field);

const trimmed = (value: string | null | undefined): string => (value ?? "").trim();

/**
 * Validates the DM-040 field rules in form field order (AR-005 step 1): type, projectId, subcontractorId
 * (BR-CON-002 presence / BR-CON-003), number, date, value, description. References and uniqueness are checked by
 * the use cases.
 */
export function validateContractInput(input: ContractInput): Result<ContractFields> {
  const type = trimmed(input.type);
  if (type === "") return err(requiredError("type"));
  if (!isContractType(type)) return err(formatError("type"));
  const projectId = trimmed(input.projectId);
  if (projectId === "") return err(requiredError("projectId"));
  const subcontractorText = trimmed(input.subcontractorId);
  if (type === "OUTGOING" && subcontractorText === "") return err(subcontractorRequiredError());
  if (type === "INCOMING" && subcontractorText !== "") return err(subcontractorForbiddenError());
  const number = requiredText(input.number, 50, "number");
  if (!number.ok) return number;
  const date = createDateOnly(input.date ?? "", "date");
  if (!date.ok) return date;
  if (input.value === null || input.value === undefined) return err(requiredError("value"));
  const value = createMoney(input.value, "value");
  if (!value.ok) return value;
  const description = optionalText(input.description, 1000, "description");
  if (!description.ok) return description;
  return ok({
    number: number.value,
    type,
    projectId,
    subcontractorId: type === "OUTGOING" ? subcontractorText : null,
    value: value.value,
    date: date.value,
    description: description.value,
  });
}
