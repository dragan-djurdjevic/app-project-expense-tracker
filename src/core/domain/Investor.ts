// Spec: DM-010, DM-001, BR-GEN-002, BR-GEN-003, BR-INV-001
import { domainError, type DomainError } from "./DomainError";
import { createEmail, type Email } from "./Email";
import type { Entity } from "./Entity";
import { ok, type Result } from "./Result";
import { optionalText, requiredText } from "./Text";
import { createVatNumber, type VatNumber } from "./VatNumber";

export interface InvestorFields {
  name: string;
  vatNumber: VatNumber;
  contactPerson: string | null;
  email: Email | null;
  phone: string | null;
}

export interface Investor extends Entity, InvestorFields {}

/** Investor as shown in the Investors list (UI-010): with the count of active (non-archived) projects. */
export interface InvestorListItem extends Investor {
  projectCount: number;
}

/** Raw form input for create/update (UI-011). */
export interface InvestorInput {
  name: string;
  vatNumber: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** BR-INV-001: investor VAT number unique among investors. */
export const investorVatDuplicateError = (): DomainError =>
  domainError("BR-INV-001", "errors.vat.duplicate", "vatNumber");

/** Validates DM-010 field rules; returns the first error in form order. */
export function validateInvestorInput(input: InvestorInput): Result<InvestorFields> {
  const name = requiredText(input.name, 200, "name");
  if (!name.ok) return name;
  const vatNumber = createVatNumber(input.vatNumber ?? "", "vatNumber");
  if (!vatNumber.ok) return vatNumber;
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
  });
}
