// Spec: DM-000
/** Common fields of every business entity (ISO 8601 UTC timestamps). */
export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
