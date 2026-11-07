// Spec: DM-020
import type { Email } from "./Email";
import type { Entity } from "./Entity";
import type { VatNumber } from "./VatNumber";

export interface SubcontractorFields {
  name: string;
  vatNumber: VatNumber;
  contactPerson: string | null;
  email: Email | null;
  phone: string | null;
  industry: string | null;
}

export interface Subcontractor extends Entity, SubcontractorFields {}
