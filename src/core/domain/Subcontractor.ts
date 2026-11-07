// Spec: DM-020, DM-001, BR-GEN-002, BR-GEN-003, BR-SUB-001
import { domainError, type DomainError } from "./DomainError";
import { createEmail, type Email } from "./Email";
import type { Entity } from "./Entity";
import { ok, type Result } from "./Result";
import { optionalText, requiredText } from "./Text";
import { createVatNumber, type VatNumber } from "./VatNumber";

export interface SubcontractorFields {
  name: string;
  vatNumber: VatNumber;
  contactPerson: string | null;
  email: Email | null;
  phone: string | null;
  industry: string | null;
}

export interface Subcontractor extends Entity, SubcontractorFields {}

/** Raw form input for create/update (UI-021). */
export interface SubcontractorInput {
  name: string;
  vatNumber: string;
  industry?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** BR-SUB-001: subcontractor VAT number unique among subcontractors. */
export const subcontractorVatDuplicateError = (): DomainError =>
  domainError("BR-SUB-001", "errors.vat.duplicate", "vatNumber");

/** Validates DM-020 field rules; returns the first error in form order. */
export function validateSubcontractorInput(input: SubcontractorInput): Result<SubcontractorFields> {
  const name = requiredText(input.name, 200, "name");
  if (!name.ok) return name;
  const vatNumber = createVatNumber(input.vatNumber ?? "", "vatNumber");
  if (!vatNumber.ok) return vatNumber;
  const industry = optionalText(input.industry, 100, "industry");
  if (!industry.ok) return industry;
  const contactPerson = optionalText(input.contactPerson, 200, "contactPerson");
  if (!contactPerson.ok) return contactPerson;
  const email = createEmail(input.email, "email");
  if (!email.ok) return email;
  const phone = optionalText(input.phone, 50, "phone");
  if (!phone.ok) return phone;
  return ok({
    name: name.value,
    vatNumber: vatNumber.value,
    contactPerson: contactPerson.value,
    email: email.value,
    phone: phone.value,
    industry: industry.value,
  });
}
