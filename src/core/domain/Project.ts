// Spec: DM-030
import type { DateOnly } from "./DateOnly";
import type { Entity } from "./Entity";
import type { Money } from "./Money";

export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "DONE", "CANCELLED"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectFields {
  name: string;
  deadline: DateOnly | null;
  status: ProjectStatus;
  budget: Money | null;
  investorId: string;
}

export interface Project extends Entity, ProjectFields {}
