// Spec: AR-005, DM-001
export interface DomainError {
  /** Business rule ID, e.g. "BR-GEN-001". */
  code: string;
  field?: string;
  /** i18n key translated by the UI, e.g. "errors.money.invalid". */
  messageKey: string;
}

export function domainError(code: string, messageKey: string, field?: string): DomainError {
  return field === undefined ? { code, messageKey } : { code, messageKey, field };
}

export const requiredError = (field?: string): DomainError => domainError("BR-GEN-002", "errors.required", field);
export const formatError = (field?: string): DomainError => domainError("BR-GEN-003", "errors.format", field);
export const moneyError = (field?: string): DomainError => domainError("BR-GEN-001", "errors.money.invalid", field);
