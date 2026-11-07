// Spec: DM-040
import type { DateOnly } from "./DateOnly";
import type { Entity } from "./Entity";
import type { Money } from "./Money";

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
