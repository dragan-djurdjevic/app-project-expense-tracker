// Spec: AR-001, AR-005, AR-009, UI-080, UI-010, UI-020, UI-030, UI-032
import type { ArchiveInvestor } from "../core/usecases/investor/archiveInvestor";
import type { CreateInvestor } from "../core/usecases/investor/createInvestor";
import type { GetInvestor } from "../core/usecases/investor/getInvestor";
import type { ListInvestors } from "../core/usecases/investor/listInvestors";
import type { RestoreInvestor } from "../core/usecases/investor/restoreInvestor";
import type { UpdateInvestor } from "../core/usecases/investor/updateInvestor";
import type { ArchiveProject } from "../core/usecases/project/archiveProject";
import type { CreateProject } from "../core/usecases/project/createProject";
import type { GetAvailableYears } from "../core/usecases/project/getAvailableYears";
import type { GetProject } from "../core/usecases/project/getProject";
import type { ListProjects } from "../core/usecases/project/listProjects";
import type { RestoreProject } from "../core/usecases/project/restoreProject";
import type { UpdateProject } from "../core/usecases/project/updateProject";
import type { GetSettings } from "../core/usecases/settings/getSettings";
import type { UpdateSettings } from "../core/usecases/settings/updateSettings";
import type { ArchiveSubcontractor } from "../core/usecases/subcontractor/archiveSubcontractor";
import type { CreateSubcontractor } from "../core/usecases/subcontractor/createSubcontractor";
import type { GetSubcontractor } from "../core/usecases/subcontractor/getSubcontractor";
import type { ListSubcontractors } from "../core/usecases/subcontractor/listSubcontractors";
import type { RestoreSubcontractor } from "../core/usecases/subcontractor/restoreSubcontractor";
import type { UpdateSubcontractor } from "../core/usecases/subcontractor/updateSubcontractor";

export interface UseCases {
  getSettings: GetSettings;
  updateSettings: UpdateSettings;
  listInvestors: ListInvestors;
  getInvestor: GetInvestor;
  createInvestor: CreateInvestor;
  updateInvestor: UpdateInvestor;
  archiveInvestor: ArchiveInvestor;
  restoreInvestor: RestoreInvestor;
  listSubcontractors: ListSubcontractors;
  getSubcontractor: GetSubcontractor;
  createSubcontractor: CreateSubcontractor;
  updateSubcontractor: UpdateSubcontractor;
  archiveSubcontractor: ArchiveSubcontractor;
  restoreSubcontractor: RestoreSubcontractor;
  listProjects: ListProjects;
  getProject: GetProject;
  createProject: CreateProject;
  updateProject: UpdateProject;
  archiveProject: ArchiveProject;
  restoreProject: RestoreProject;
  getAvailableYears: GetAvailableYears;
}

export type RuntimeMode = "tauri" | "browser";

export interface RuntimeInfo {
  mode: RuntimeMode;
  /** Absolute DB file path (Tauri mode) or null (in-memory browser mode). */
  dbPath: string | null;
  /** Absolute documents folder (Tauri mode) or null (browser mode). */
  documentsPath: string | null;
  /** Opens a folder in the OS file manager; null when not available (browser mode). */
  openFolder: ((path: string) => Promise<void>) | null;
}

export interface Container {
  useCases: UseCases;
  runtime: RuntimeInfo;
}

/** Raised when the startup sequence (AR-010 steps 1–3) fails. */
export class StartupError extends Error {
  constructor(
    message: string,
    readonly dbPath: string | null,
  ) {
    super(message);
    this.name = "StartupError";
  }
}
