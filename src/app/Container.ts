// Spec: AR-001, AR-005, AR-009, UI-080, UI-010, UI-020, UI-030, UI-032, UI-040, UI-041, UI-050, UI-051, UI-053
import type { ArchiveContract } from "../core/usecases/contract/archiveContract";
import type { CreateContract } from "../core/usecases/contract/createContract";
import type { GetContract } from "../core/usecases/contract/getContract";
import type { ListContracts } from "../core/usecases/contract/listContracts";
import type { RestoreContract } from "../core/usecases/contract/restoreContract";
import type { UpdateContract } from "../core/usecases/contract/updateContract";
import type { InvoiceAttachmentFile } from "../core/domain/Invoice";
import type { ArchiveInvoice } from "../core/usecases/invoice/archiveInvoice";
import type { AttachInvoiceDocument } from "../core/usecases/invoice/attachInvoiceDocument";
import type { ChangeInvoiceStatus } from "../core/usecases/invoice/changeInvoiceStatus";
import type { CreateInvoice } from "../core/usecases/invoice/createInvoice";
import type { GetInvoice } from "../core/usecases/invoice/getInvoice";
import type { ListInvoices } from "../core/usecases/invoice/listInvoices";
import type { OpenInvoiceDocument } from "../core/usecases/invoice/openInvoiceDocument";
import type { RemoveInvoiceDocument } from "../core/usecases/invoice/removeInvoiceDocument";
import type { RestoreInvoice } from "../core/usecases/invoice/restoreInvoice";
import type { UpdateInvoice } from "../core/usecases/invoice/updateInvoice";
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
  listContracts: ListContracts;
  getContract: GetContract;
  createContract: CreateContract;
  updateContract: UpdateContract;
  archiveContract: ArchiveContract;
  restoreContract: RestoreContract;
  listInvoices: ListInvoices;
  getInvoice: GetInvoice;
  createInvoice: CreateInvoice;
  updateInvoice: UpdateInvoice;
  archiveInvoice: ArchiveInvoice;
  restoreInvoice: RestoreInvoice;
  changeInvoiceStatus: ChangeInvoiceStatus;
  attachInvoiceDocument: AttachInvoiceDocument;
  removeInvoiceDocument: RemoveInvoiceDocument;
  openInvoiceDocument: OpenInvoiceDocument;
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
  /** UI-053: native PDF file dialog (Tauri mode); null in browser mode (hidden file input instead). */
  pickPdf: (() => Promise<InvoiceAttachmentFile | null>) | null;
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
