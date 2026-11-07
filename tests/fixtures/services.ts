// Spec: AR-004, AR-005
import { SqliteInvestorRepository } from "../../src/adapters/sqlite/SqliteInvestorRepository";
import { SqliteProjectRepository } from "../../src/adapters/sqlite/SqliteProjectRepository";
import { SqliteSubcontractorRepository } from "../../src/adapters/sqlite/SqliteSubcontractorRepository";
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

/** Real SQLite repositories on a fresh in-memory DB, wired to the M2 use cases like `composition.ts`. */
export async function setupServices() {
  const db = await migratedDb();
  const clock = controlledClock("2026-01-01T00:00:00.000Z");
  const ids = sequentialIds();
  const investorRepo = new SqliteInvestorRepository(db, clock);
  const subcontractorRepo = new SqliteSubcontractorRepository(db, clock);
  const projectRepo = new SqliteProjectRepository(db, clock);
  return {
    db,
    clock,
    investorRepo,
    subcontractorRepo,
    projectRepo,
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
    getProject: makeGetProject({ projectRepo, investorRepo }),
    createProject: makeCreateProject({ projectRepo, investorRepo, clock, ids }),
    updateProject: makeUpdateProject({ projectRepo, investorRepo, clock }),
    archiveProject: makeArchiveProject({ projectRepo }),
    restoreProject: makeRestoreProject({ projectRepo }),
    getAvailableYears: makeGetAvailableYears({ projectRepo, clock }),
  };
}

/** Unwraps an ok Result or fails the test. */
export function value<T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!result.ok) throw new Error(`Expected ok result, got ${JSON.stringify(result.error)}`);
  return result.value;
}
