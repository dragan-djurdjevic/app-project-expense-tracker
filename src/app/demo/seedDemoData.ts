// Spec: DEMO-001, DEMO-002, DEMO-003, DEMO-004, AR-010, AR-003
import { localDateOnly } from "../../core/domain/Invoice";
import type { Clock } from "../../core/ports/Clock";
import type { UseCases } from "../Container";
import {
  DEMO_ATTACHMENTS,
  DEMO_CONTRACTS,
  DEMO_INVESTORS,
  DEMO_INVOICES,
  DEMO_PROJECTS,
  DEMO_SUBCONTRACTORS,
  type DemoPdfFile,
} from "./demoDataset";
import { demoDueDate, resolveDemoDate } from "./resolveDemoDate";

/** DEMO-001: the use cases the seed needs. */
export type DemoSeedUseCases = Pick<
  UseCases,
  | "listInvestors"
  | "listProjects"
  | "createInvestor"
  | "createSubcontractor"
  | "createProject"
  | "createContract"
  | "createInvoice"
  | "changeInvoiceStatus"
  | "attachInvoiceDocument"
  | "archiveInvoice"
  | "archiveContract"
  | "archiveProject"
  | "archiveInvestor"
  | "archiveSubcontractor"
>;

/** DEMO-004: loads a bundled demo PDF. */
export type LoadDemoPdf = (file: DemoPdfFile) => Promise<Uint8Array>;

type Outcome<T> = { ok: true; value: T } | { ok: false; error: { code: string } };

/** DEMO-001: a use case returning `ok: false` while seeding is a programming error. */
function must<T>(result: Outcome<T>, step: string): T {
  if (!result.ok) throw new Error(`Demo seed failed at ${step}: ${result.error.code}`);
  return result.value;
}

const minor = (units: number): number => units * 100;

function idOf(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (id === undefined) throw new Error(`Demo seed: unknown key ${key}`);
  return id;
}

/**
 * DEMO-001: creates the DEMO-003 dataset through the use cases only; does nothing when any investor or project
 * (archived included) exists. Returns true when data was seeded.
 */
export async function seedDemoData(useCases: DemoSeedUseCases, clock: Clock, loadPdf: LoadDemoPdf): Promise<boolean> {
  const investors = must(await useCases.listInvestors({ includeArchived: true }), "listInvestors");
  const projects = must(await useCases.listProjects({ includeArchived: true }), "listProjects");
  if (investors.length > 0 || projects.length > 0) return false;

  const today = localDateOnly(clock.now());
  const date = (relative: string) => resolveDemoDate(relative, today);
  const ids = new Map<string, string>();

  for (const row of DEMO_INVESTORS) {
    const { key, name, vatNumber, contactPerson, email, phone } = row;
    const created = must(await useCases.createInvestor({ name, vatNumber, contactPerson, email, phone }), key);
    ids.set(key, created.id);
  }
  for (const row of DEMO_SUBCONTRACTORS) {
    const { key, name, vatNumber, industry, contactPerson, email } = row;
    const created = must(
      await useCases.createSubcontractor({ name, vatNumber, industry, contactPerson, email, phone: null }),
      key,
    );
    ids.set(key, created.id);
  }
  for (const row of DEMO_PROJECTS) {
    const created = must(
      await useCases.createProject({
        name: row.name,
        investorId: idOf(ids, row.investor),
        status: row.status,
        deadline: date(row.deadline),
        budget: row.budget === null ? null : minor(row.budget),
      }),
      row.key,
    );
    ids.set(row.key, created.id);
  }
  for (const row of DEMO_CONTRACTS) {
    const created = must(
      await useCases.createContract({
        type: row.type,
        projectId: idOf(ids, row.project),
        subcontractorId: row.subcontractor === null ? null : idOf(ids, row.subcontractor),
        number: row.number,
        date: date(row.date),
        value: minor(row.value),
        description: row.description,
      }),
      row.key,
    );
    ids.set(row.key, created.id);
  }
  for (const row of DEMO_INVOICES) {
    const invoiceDate = date(row.date);
    const created = must(
      await useCases.createInvoice({
        contractId: idOf(ids, row.contract),
        number: row.number,
        date: invoiceDate,
        dueDate: demoDueDate(invoiceDate),
        value: minor(row.net),
        vatRate: row.vatRate,
        status: row.status === "PAID" ? "ISSUED" : row.status,
        description: null,
      }),
      row.key,
    );
    ids.set(row.key, created.id);
  }

  for (const row of DEMO_INVOICES.filter((invoice) => invoice.status === "PAID")) {
    must(await useCases.changeInvoiceStatus(idOf(ids, row.key), "PAID"), `${row.key} PAID`);
  }

  for (const attachment of DEMO_ATTACHMENTS) {
    const bytes = await loadPdf(attachment.file);
    must(
      await useCases.attachInvoiceDocument(idOf(ids, attachment.invoice), { name: attachment.originalName, bytes }),
      `${attachment.invoice} attachment`,
    );
  }

  const archived = <T extends { key: string; archived: boolean }>(rows: readonly T[]) =>
    rows.filter((row) => row.archived).map((row) => idOf(ids, row.key));
  for (const id of archived(DEMO_INVOICES)) must(await useCases.archiveInvoice(id), "archiveInvoice");
  for (const id of archived(DEMO_CONTRACTS)) must(await useCases.archiveContract(id), "archiveContract");
  for (const id of archived(DEMO_PROJECTS)) must(await useCases.archiveProject(id), "archiveProject");
  for (const id of archived(DEMO_INVESTORS)) must(await useCases.archiveInvestor(id), "archiveInvestor");
  for (const id of archived(DEMO_SUBCONTRACTORS)) must(await useCases.archiveSubcontractor(id), "archiveSubcontractor");
  return true;
}
