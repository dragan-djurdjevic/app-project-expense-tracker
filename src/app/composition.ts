// Spec: AR-001, AR-002, AR-003, AR-005, AR-009, AR-010, DS-001, DS-004, UI-010, UI-020, UI-030, UI-032, UI-040, UI-041, UI-050, UI-051, UI-052, UI-053, DM-050
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { bundledMigrations } from "../adapters/sqlite/bundledMigrations";
import { ensureSettingsRow, runMigrations } from "../adapters/sqlite/runMigrations";
import type { SqlDriver } from "../adapters/sqlite/SqlDriver";
import { SqliteContractRepository } from "../adapters/sqlite/SqliteContractRepository";
import { SqliteInvestorRepository } from "../adapters/sqlite/SqliteInvestorRepository";
import { SqliteInvoiceRepository } from "../adapters/sqlite/SqliteInvoiceRepository";
import { SqliteProjectRepository } from "../adapters/sqlite/SqliteProjectRepository";
import { SqliteSettingsRepository } from "../adapters/sqlite/SqliteSettingsRepository";
import { SqliteSubcontractorRepository } from "../adapters/sqlite/SqliteSubcontractorRepository";
import { SqlJsDriver } from "../adapters/sqlite/SqlJsDriver";
import { FsDocumentStorage } from "../adapters/storage/FsDocumentStorage";
import { InMemoryDocumentStorage } from "../adapters/storage/InMemoryDocumentStorage";
import { SystemClock } from "../adapters/system/SystemClock";
import { UuidIdGenerator } from "../adapters/system/UuidIdGenerator";
import { getDataDir, isTauriRuntime, joinPath, openInOs, pickPdfFile } from "../adapters/tauri/platform";
import { TauriSqlDriver } from "../adapters/tauri/TauriSqlDriver";
import type { DocumentStorage } from "../core/ports/DocumentStorage";
import { makeArchiveContract } from "../core/usecases/contract/archiveContract";
import { makeCreateContract } from "../core/usecases/contract/createContract";
import { makeGetContract } from "../core/usecases/contract/getContract";
import { makeListContracts } from "../core/usecases/contract/listContracts";
import { makeRestoreContract } from "../core/usecases/contract/restoreContract";
import { makeUpdateContract } from "../core/usecases/contract/updateContract";
import { makeArchiveInvoice } from "../core/usecases/invoice/archiveInvoice";
import { makeAttachInvoiceDocument } from "../core/usecases/invoice/attachInvoiceDocument";
import { makeChangeInvoiceStatus } from "../core/usecases/invoice/changeInvoiceStatus";
import { makeCreateInvoice } from "../core/usecases/invoice/createInvoice";
import { makeGetInvoice } from "../core/usecases/invoice/getInvoice";
import { makeListInvoices } from "../core/usecases/invoice/listInvoices";
import { makeOpenInvoiceDocument } from "../core/usecases/invoice/openInvoiceDocument";
import { makeRemoveInvoiceDocument } from "../core/usecases/invoice/removeInvoiceDocument";
import { makeRestoreInvoice } from "../core/usecases/invoice/restoreInvoice";
import { makeUpdateInvoice } from "../core/usecases/invoice/updateInvoice";
import { makeArchiveInvestor } from "../core/usecases/investor/archiveInvestor";
import { makeCreateInvestor } from "../core/usecases/investor/createInvestor";
import { makeGetInvestor } from "../core/usecases/investor/getInvestor";
import { makeListInvestors } from "../core/usecases/investor/listInvestors";
import { makeRestoreInvestor } from "../core/usecases/investor/restoreInvestor";
import { makeUpdateInvestor } from "../core/usecases/investor/updateInvestor";
import { makeArchiveProject } from "../core/usecases/project/archiveProject";
import { makeCreateProject } from "../core/usecases/project/createProject";
import { makeGetAvailableYears } from "../core/usecases/project/getAvailableYears";
import { makeGetProject } from "../core/usecases/project/getProject";
import { makeListProjects } from "../core/usecases/project/listProjects";
import { makeRestoreProject } from "../core/usecases/project/restoreProject";
import { makeUpdateProject } from "../core/usecases/project/updateProject";
import { makeGetSettings } from "../core/usecases/settings/getSettings";
import { makeUpdateSettings } from "../core/usecases/settings/updateSettings";
import { makeArchiveSubcontractor } from "../core/usecases/subcontractor/archiveSubcontractor";
import { makeCreateSubcontractor } from "../core/usecases/subcontractor/createSubcontractor";
import { makeGetSubcontractor } from "../core/usecases/subcontractor/getSubcontractor";
import { makeListSubcontractors } from "../core/usecases/subcontractor/listSubcontractors";
import { makeRestoreSubcontractor } from "../core/usecases/subcontractor/restoreSubcontractor";
import { makeUpdateSubcontractor } from "../core/usecases/subcontractor/updateSubcontractor";
import { StartupError, type Container, type RuntimeInfo } from "./Container";
import { makeTestHooks } from "./testHooks";

const DB_FILE = "tracker.db";
const DOCUMENTS_DIR = "documents";

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Builds the container; runs the startup sequence of AR-010 (steps 1–3). */
export async function createContainer(): Promise<Container> {
  const clock = new SystemClock();
  const ids = new UuidIdGenerator();

  let db: SqlDriver;
  let documents: DocumentStorage;
  let runtime: RuntimeInfo;
  let dbPath: string | null = null;
  let inMemoryDocuments: InMemoryDocumentStorage | null = null;

  try {
    if (isTauriRuntime()) {
      const dataDir = await getDataDir();
      dbPath = await joinPath(dataDir, DB_FILE);
      const documentsPath = await joinPath(dataDir, DOCUMENTS_DIR);
      db = await TauriSqlDriver.open(dbPath);
      documents = new FsDocumentStorage(documentsPath, ids);
      runtime = { mode: "tauri", dbPath, documentsPath, openFolder: openInOs, pickPdf: pickPdfFile };
    } else {
      db = await SqlJsDriver.create({ locateFile: () => wasmUrl });
      inMemoryDocuments = new InMemoryDocumentStorage(ids);
      documents = inMemoryDocuments;
      runtime = { mode: "browser", dbPath: null, documentsPath: null, openFolder: null, pickPdf: null };
    }
    await runMigrations(db, bundledMigrations(), clock);
    await ensureSettingsRow(db);
  } catch (error) {
    throw new StartupError(message(error), dbPath);
  }

  const settingsRepo = new SqliteSettingsRepository(db);
  const investorRepo = new SqliteInvestorRepository(db, clock);
  const subcontractorRepo = new SqliteSubcontractorRepository(db, clock);
  const projectRepo = new SqliteProjectRepository(db, clock);
  const contractRepo = new SqliteContractRepository(db, clock);
  const invoiceRepo = new SqliteInvoiceRepository(db, clock);

  if (inMemoryDocuments && import.meta.env.MODE === "e2e") {
    window.__TEST__ = makeTestHooks(db, inMemoryDocuments, (await import("./e2eFixtures")).e2eFixtures);
  }

  return {
    useCases: {
      getSettings: makeGetSettings({ settingsRepo }),
      updateSettings: makeUpdateSettings({ settingsRepo }),
      listInvestors: makeListInvestors({ investorRepo, projectRepo }),
      getInvestor: makeGetInvestor({ investorRepo }),
      createInvestor: makeCreateInvestor({ investorRepo, clock, ids }),
      updateInvestor: makeUpdateInvestor({ investorRepo, clock }),
      archiveInvestor: makeArchiveInvestor({ investorRepo }),
      restoreInvestor: makeRestoreInvestor({ investorRepo }),
      listSubcontractors: makeListSubcontractors({ subcontractorRepo }),
      getSubcontractor: makeGetSubcontractor({ subcontractorRepo }),
      createSubcontractor: makeCreateSubcontractor({ subcontractorRepo, clock, ids }),
      updateSubcontractor: makeUpdateSubcontractor({ subcontractorRepo, clock }),
      archiveSubcontractor: makeArchiveSubcontractor({ subcontractorRepo }),
      restoreSubcontractor: makeRestoreSubcontractor({ subcontractorRepo }),
      listProjects: makeListProjects({ projectRepo, investorRepo }),
      getProject: makeGetProject({ projectRepo, investorRepo, contractRepo, invoiceRepo }),
      createProject: makeCreateProject({ projectRepo, investorRepo, clock, ids }),
      updateProject: makeUpdateProject({ projectRepo, investorRepo, clock }),
      archiveProject: makeArchiveProject({ projectRepo }),
      restoreProject: makeRestoreProject({ projectRepo }),
      getAvailableYears: makeGetAvailableYears({ projectRepo, clock }),
      listContracts: makeListContracts({ contractRepo }),
      getContract: makeGetContract({ contractRepo }),
      createContract: makeCreateContract({ contractRepo, projectRepo, subcontractorRepo, clock, ids }),
      updateContract: makeUpdateContract({ contractRepo, subcontractorRepo, clock }),
      archiveContract: makeArchiveContract({ contractRepo }),
      restoreContract: makeRestoreContract({ contractRepo }),
      listInvoices: makeListInvoices({ invoiceRepo, clock }),
      getInvoice: makeGetInvoice({ invoiceRepo }),
      createInvoice: makeCreateInvoice({ invoiceRepo, contractRepo, settingsRepo, clock, ids }),
      updateInvoice: makeUpdateInvoice({ invoiceRepo, contractRepo, clock }),
      archiveInvoice: makeArchiveInvoice({ invoiceRepo }),
      restoreInvoice: makeRestoreInvoice({ invoiceRepo }),
      changeInvoiceStatus: makeChangeInvoiceStatus({ invoiceRepo, clock }),
      attachInvoiceDocument: makeAttachInvoiceDocument({ invoiceRepo, documents, clock }),
      removeInvoiceDocument: makeRemoveInvoiceDocument({ invoiceRepo, documents, clock }),
      openInvoiceDocument: makeOpenInvoiceDocument({ invoiceRepo, documents }),
    },
    runtime,
  };
}
