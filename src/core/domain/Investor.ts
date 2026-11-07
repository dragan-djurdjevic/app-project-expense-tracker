// Spec: DM-010
import type { Email } from "./Email";
import type { Entity } from "./Entity";
import type { VatNumber } from "./VatNumber";

export interface InvestorFields {
  name: string;
  vatNumber: VatNumber;
  contactPerson: string | null;
  email: Email | null;
  phone: string | null;
}

export interface Investor extends Entity, InvestorFields {}
