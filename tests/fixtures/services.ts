// Spec: AR-004, AR-005, DM-040, DM-050, DS-004, AN-000
import { SqliteAnalyticsQuery } from "../../src/adapters/sqlite/SqliteAnalyticsQuery";
import { SqliteContractRepository } from "../../src/adapters/sqlite/SqliteContractRepository";
import { SqliteInvestorRepository } from "../../src/adapters/sqlite/SqliteInvestorRepository";
import { SqliteInvoiceRepository } from "../../src/adapters/sqlite/SqliteInvoiceRepository";
import { SqliteSettingsRepository } from "../../src/adapters/sqlite/SqliteSettingsRepository";
import { SqliteProjectRepository } from "../../src/adapters/sqlite/SqliteProjectRepository";
import { SqliteSubcontractorRepository } from "../../src/adapters/sqlite/SqliteSubcontractorRepository";
import { makeGetBudgetRealisation } from "../../src/core/usecases/analytics/getBudgetRealisation";
import { makeGetContractedVsCollected } from "../../src/core/usecases/analytics/getContractedVsCollected";
import { makeGetNetResult } from "../../src/core/usecases/analytics/getNetResult";
import { makeGetProjectsInYear } from "../../src/core/usecases/analytics/getProjectsInYear";
import { makeGetSubcontractorPayments } from "../../src/core/usecases/analytics/getSubcontractorPayments";
import { makeArchiveContract } from "../../src/core/usecases/contract/archiveContract";
import { makeCreateContract } from "../../src/core/usecases/contract/createContract";
import { makeGetContract } from "../../src/core/usecases/contract/getContract";
import { makeListContracts } from "../../src/core/usecases/contract/listContracts";
import { makeRestoreContract } from "../../src/core/usecases/contract/restoreContract";
import { makeUpdateContract } from "../../src/core/usecases/contract/updateContract";
import { InMemoryDocumentStorage } from "../../src/adapters/storage/InMemoryDocumentStorage";
import { makeArchiveInvoice } from "../../src/core/usecases/invoice/archiveInvoice";
import { makeAttachInvoiceDocument } from "../../src/core/usecases/invoice/attachInvoiceDocument";
import { makeChangeInvoiceStatus } from "../../src/core/usecases/invoice/changeInvoiceStatus";
import { makeCreateInvoice } from "../../src/core/usecases/invoice/createInvoice";
import { makeGetInvoice } from "../../src/core/usecases/invoice/getInvoice";
import { makeListInvoices } from "../../src/core/usecases/invoice/listInvoices";
import { makeOpenInvoiceDocument } from "../../src/core/usecases/invoice/openInvoiceDocument";
import { makeRemoveInvoiceDocument } from "../../src/core/usecases/invoice/removeInvoiceDocument";
import { makeRestoreInvoice } from "../../src/core/usecases/invoice/restoreInvoice";
import { makeUpdateInvoice } from "../../src/core/usecases/invoice/updateInvoice";
import { makeArchiveInvestor } from "../../src/core/usecases/investor/archiveInvestor";
import { makeCreateInvestor } from "../../src/core/usecases/investor/createInvestor";
import { makeGetInvestor } from "../../src/core/usecases/investor/getInvestor";
import { makeListInvestors } from "../../src/core/usecases/investor/listInvestors";
import { makeRestoreInvestor } from "../../src/core/usecases/investor/restoreInvestor";
import { makeUpdateInvestor } from "../../src/core/usecases/investor/updateInvestor";
import { makeArchiveProject } from "../../src/core/usecases/project/archiveProject";
import { makeCreateProject } from "../../src/core/usecases/project/createProject";
import { makeGetAvailableYears } from "../../src/core/usecases/project/getAvailableYears";
import { makeGetProject } from "../../src/core/usecases/project/getProject";
import { makeListProjects } from "../../src/core/usecases/project/listProjects";
import { makeRestoreProject } from "../../src/core/usecases/project/restoreProject";
import { makeUpdateProject } from "../../src/core/usecases/project/updateProject";
import { makeArchiveSubcontractor } from "../../src/core/usecases/subcontractor/archiveSubcontractor";
import { makeCreateSubcontractor } from "../../src/core/usecases/subcontractor/createSubcontractor";
import { makeGetSubcontractor } from "../../src/core/usecases/subcontractor/getSubcontractor";
import { makeListSubcontractors } from "../../src/core/usecases/subcontractor/listSubcontractors";
import { makeRestoreSubcontractor } from "../../src/core/usecases/subcontractor/restoreSubcontractor";
import { makeUpdateSubcontractor } from "../../src/core/usecases/subcontractor/updateSubcontractor";
import { controlledClock } from "./controlledClock";
import { migratedDb } from "./db";
import { sequentialIds } from "./fixedClock";

/** Real SQLite repositories on a fresh in-memory DB, wired to the M2–M5 use cases like `composition.ts`. */
export async function setupServices() {
  const db = await migratedDb();
  const clock = controlledClock("2026-01-01T00:00:00.000Z");
  const ids = sequentialIds();
  const investorRepo = new SqliteInvestorRepository(db, clock);
  const subcontractorRepo = new SqliteSubcontractorRepository(db, clock);
  const projectRepo = new SqliteProjectRepository(db, clock);
  const contractRepo = new SqliteContractRepository(db, clock);
  const invoiceRepo = new SqliteInvoiceRepository(db, clock);
  const settingsRepo = new SqliteSettingsRepository(db);
  const analyticsQuery = new SqliteAnalyticsQuery(db, projectRepo);
  const documents = new InMemoryDocumentStorage(sequentialIds("90000000-0000-4000-8000-"));
  return {
    db,
    clock,
    investorRepo,
    subcontractorRepo,
    projectRepo,
    contractRepo,
    invoiceRepo,
    settingsRepo,
    analyticsQuery,
    documents,
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
    getContractedVsCollected: makeGetContractedVsCollected({ analyticsQuery }),
    getSubcontractorPayments: makeGetSubcontractorPayments({ analyticsQuery }),
    getProjectsInYear: makeGetProjectsInYear({ analyticsQuery }),
    getNetResult: makeGetNetResult({ analyticsQuery }),
    getBudgetRealisation: makeGetBudgetRealisation({ analyticsQuery }),
  };
}

/** Unwraps an ok Result or fails the test. */
export function value<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) throw new Error(`Expected ok result, got ${JSON.stringify(result.error)}`);
  return result.value;
}
