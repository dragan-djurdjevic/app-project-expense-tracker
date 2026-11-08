// Spec: DEMO-003, DEMO-004, DEMO-002
import type { ContractType } from "../../core/domain/Contract";
import type { InvoiceStatus } from "../../core/domain/Invoice";
import type { ProjectStatus } from "../../core/domain/Project";

/** DEMO-004: the bundled demo PDFs in `src/app/demo/assets/`. */
export const DEMO_PDF_FILES = ["demo-invoice-a.pdf", "demo-invoice-b.pdf"] as const;
export type DemoPdfFile = (typeof DEMO_PDF_FILES)[number];

export interface DemoInvestor {
  key: string;
  name: string;
  vatNumber: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  archived: boolean;
}

export interface DemoSubcontractor {
  key: string;
  name: string;
  vatNumber: string;
  industry: string | null;
  contactPerson: string | null;
  email: string | null;
  archived: boolean;
}

export interface DemoProject {
  key: string;
  name: string;
  investor: string;
  status: ProjectStatus;
  /** Currency units (minor units = × 100); null = no budget. */
  budget: number | null;
  /** DEMO-002 relative date. */
  deadline: string;
  archived: boolean;
}

export interface DemoContract {
  key: string;
  number: string;
  project: string;
  type: ContractType;
  subcontractor: string | null;
  /** Currency units (minor units = × 100). */
  value: number;
  /** DEMO-002 relative date. */
  date: string;
  description: string;
  archived: boolean;
}

export interface DemoInvoice {
  key: string;
  number: string;
  contract: string;
  /** Net, currency units (minor units = × 100). */
  net: number;
  /** Basis points (2000 = 20 %). */
  vatRate: number;
  /** DEMO-002 relative date; due date = date + 30 days. */
  date: string;
  status: InvoiceStatus;
  archived: boolean;
}

export interface DemoAttachment {
  invoice: string;
  file: DemoPdfFile;
  originalName: string;
}

/** DEMO-003 investors. */
export const DEMO_INVESTORS: readonly DemoInvestor[] = [
  {
    key: "I1",
    name: "Northwind Developments",
    vatNumber: "NWD-1001",
    contactPerson: "Emma Clarke",
    email: "emma.clarke@northwind.example",
    phone: "+44 20 7946 0101",
    archived: false,
  },
  {
    key: "I2",
    name: "Harbor City Council",
    vatNumber: "HCC-2002",
    contactPerson: "Daniel Moore",
    email: "d.moore@harborcity.example",
    phone: "+44 20 7946 0202",
    archived: false,
  },
  {
    key: "I3",
    name: "Greenleaf Properties",
    vatNumber: "GLP-3003",
    contactPerson: "Sophie Turner",
    email: "sophie@greenleaf.example",
    phone: "+44 20 7946 0303",
    archived: false,
  },
  {
    key: "I4",
    name: "Summit Retail Group",
    vatNumber: "SRG-4004",
    contactPerson: "James Walker",
    email: null,
    phone: null,
    archived: true,
  },
];

/** DEMO-003 subcontractors. */
export const DEMO_SUBCONTRACTORS: readonly DemoSubcontractor[] = [
  {
    key: "S1",
    name: "Atlas Structural Engineering",
    vatNumber: "ATL-5001",
    industry: "Structural engineering",
    contactPerson: "Oliver Hughes",
    email: "office@atlas-eng.example",
    archived: false,
  },
  {
    key: "S2",
    name: "BlueAir HVAC Systems",
    vatNumber: "BAH-5002",
    industry: "HVAC",
    contactPerson: "Grace Bennett",
    email: "info@blueair.example",
    archived: false,
  },
  {
    key: "S3",
    name: "Brightline Electrical",
    vatNumber: "BLE-5003",
    industry: "Electrical",
    contactPerson: "Henry Price",
    email: null,
    archived: false,
  },
  {
    key: "S4",
    name: "Terra Landscaping",
    vatNumber: "TLS-5004",
    industry: "Landscaping",
    contactPerson: "Lucy Ward",
    email: "lucy@terra.example",
    archived: false,
  },
  {
    key: "S5",
    name: "Quartz Interiors",
    vatNumber: "QIN-5005",
    industry: "Interior fit-out",
    contactPerson: null,
    email: null,
    archived: true,
  },
];

const project = (
  key: string,
  name: string,
  investor: string,
  status: ProjectStatus,
  budget: number | null,
  deadline: string,
  archived = false,
): DemoProject => ({ key, name, investor, status, budget, deadline, archived });

/** DEMO-003 projects. */
export const DEMO_PROJECTS: readonly DemoProject[] = [
  project("P1", "Riverside Apartments", "I1", "ACTIVE", 850_000, "Y+1-03-31"),
  project("P2", "Harbor Library Renovation", "I2", "DONE", 300_000, "Y-1-10-31"),
  project("P3", "Greenleaf Office Park", "I3", "ACTIVE", 1_200_000, "Y+2-06-30"),
  project("P4", "City Sports Hall", "I2", "ON_HOLD", 540_000, "Y+1-09-30"),
  project("P5", "Lakeside Villa", "I1", "DONE", null, "Y-2-12-15"),
  project("P6", "Summit Mall Extension", "I4", "CANCELLED", 900_000, "Y-1-06-30", true),
  project("P7", "Greenleaf Kindergarten", "I3", "PLANNED", 260_000, "Y+1-12-31"),
  project("P8", "Old Town Facade Restoration", "I2", "DONE", 150_000, "Y-2-09-30"),
];

const contract = (
  key: string,
  number: string,
  projectKey: string,
  subcontractor: string | null,
  value: number,
  date: string,
  description: string,
  archived = false,
): DemoContract => ({
  key,
  number,
  project: projectKey,
  type: subcontractor === null ? "INCOMING" : "OUTGOING",
  subcontractor,
  value,
  date,
  description,
  archived,
});

/** DEMO-003 contracts (OUTGOING = with the subcontractor given). */
export const DEMO_CONTRACTS: readonly DemoContract[] = [
  contract("C01", "LV-IN-01", "P5", null, 180_000, "Y-2-02-10", "Architectural design and site supervision"),
  contract("C02", "LV-OUT-01", "P5", "S1", 30_000, "Y-2-03-01", "Structural design"),
  contract("C03", "LV-OUT-02", "P5", "S4", 12_000, "Y-2-05-15", "Garden and terrace landscaping"),
  contract("C04", "OT-IN-01", "P8", null, 140_000, "Y-2-04-20", "Facade restoration design"),
  contract("C05", "OT-OUT-01", "P8", "S1", 25_000, "Y-2-05-05", "Structural survey"),
  contract("C06", "HL-IN-01", "P2", null, 280_000, "Y-1-01-20", "Renovation design and supervision"),
  contract("C07", "HL-IN-02", "P2", null, 50_000, "Y-1-07-01", "Addendum: reading room extension"),
  contract("C08", "HL-OUT-01", "P2", "S2", 45_000, "Y-1-02-15", "HVAC design"),
  contract("C09", "HL-OUT-02", "P2", "S3", 30_000, "Y-1-03-10", "Electrical design"),
  contract("C10", "RA-IN-01", "P1", null, 600_000, "Y-1-09-15", "Main design contract"),
  contract("C11", "RA-IN-02", "P1", null, 150_000, "Y0-03-01", "Interior design package"),
  contract("C12", "RA-OUT-01", "P1", "S1", 90_000, "Y-1-10-01", "Structural engineering"),
  contract("C13", "RA-OUT-02", "P1", "S3", 60_000, "Y0-02-10", "Electrical installations design"),
  contract("C14", "RA-OUT-03", "P1", "S5", 40_000, "Y0-01-20", "Show apartment fit-out"),
  contract("C15", "GO-IN-01", "P3", null, 950_000, "Y0-01-15", "Office park master plan and design"),
  contract("C16", "GO-OUT-01", "P3", "S1", 120_000, "Y0-02-01", "Structural engineering"),
  contract("C17", "GO-OUT-02", "P3", "S2", 85_000, "Y0-04-10", "HVAC design"),
  contract("C18", "SH-IN-01", "P4", null, 400_000, "Y-1-05-10", "Sports hall design"),
  contract("C19", "SH-OUT-01", "P4", "S4", 20_000, "Y-1-06-01", "Outdoor areas (terminated)", true),
  contract("C20", "SM-IN-01", "P6", null, 200_000, "Y-2-10-01", "Mall extension concept design"),
];

const invoice = (
  key: string,
  number: string,
  contractKey: string,
  net: number,
  vatPercent: number,
  date: string,
  status: InvoiceStatus,
  archived = false,
): DemoInvoice => ({ key, number, contract: contractKey, net, vatRate: vatPercent * 100, date, status, archived });

/** DEMO-003 invoices. */
export const DEMO_INVOICES: readonly DemoInvoice[] = [
  invoice("V01", "LV-2401", "C01", 60_000, 20, "Y-2-03-01", "PAID"),
  invoice("V02", "LV-2402", "C01", 70_000, 20, "Y-2-07-01", "PAID"),
  invoice("V03", "LV-2403", "C01", 50_000, 20, "Y-2-11-15", "PAID"),
  invoice("V04", "LV-S-01", "C02", 30_000, 20, "Y-2-06-01", "PAID"),
  invoice("V05", "LV-S-02", "C03", 12_000, 10, "Y-2-08-01", "PAID"),
  invoice("V06", "OT-2401", "C04", 70_000, 20, "Y-2-06-15", "PAID"),
  invoice("V07", "OT-2402", "C04", 70_000, 20, "Y-1-01-20", "PAID"),
  invoice("V08", "OT-S-01", "C05", 25_000, 20, "Y-2-08-20", "PAID"),
  invoice("V09", "SM-2401", "C20", 40_000, 20, "Y-2-11-01", "PAID"),
  invoice("V10", "SM-2402", "C20", 60_000, 20, "Y-1-02-01", "CANCELLED"),
  invoice("V11", "HL-2501", "C06", 100_000, 20, "Y-1-03-01", "PAID"),
  invoice("V12", "HL-2502", "C06", 100_000, 20, "Y-1-06-01", "PAID"),
  invoice("V13", "HL-2503", "C06", 80_000, 20, "Y-1-09-01", "PAID"),
  invoice("V14", "HL-2504", "C07", 50_000, 20, "Y-1-10-15", "PAID"),
  invoice("V15", "HL-S-01", "C08", 45_000, 20, "Y-1-04-01", "PAID"),
  invoice("V16", "HL-S-02", "C09", 20_000, 20, "Y-1-05-01", "PAID"),
  invoice("V17", "HL-S-03", "C09", 15_000, 20, "Y-1-08-01", "PAID"),
  invoice("V18", "SH-2501", "C18", 120_000, 20, "Y-1-06-15", "PAID"),
  invoice("V19", "SH-2502", "C18", 80_000, 20, "Y-1-11-20", "ISSUED"),
  invoice("V20", "SH-S-01", "C19", 10_000, 20, "Y-1-07-01", "CANCELLED"),
  invoice("V21", "SH-S-02", "C19", 5_000, 20, "Y-1-08-01", "PAID"),
  invoice("V22", "RA-2501", "C10", 150_000, 20, "Y-1-10-15", "PAID"),
  invoice("V23", "RA-2502", "C10", 200_000, 20, "Y0-02-01", "PAID"),
  invoice("V24", "RA-2503", "C10", 100_000, 20, "Y0-05-01", "ISSUED"),
  invoice("V25", "RA-2601", "C11", 50_000, 20, "Y0-04-01", "PAID"),
  invoice("V26", "RA-2602", "C11", 40_000, 20, "Y0-06-01", "DRAFT"),
  invoice("V27", "RA-S-01", "C12", 45_000, 20, "Y-1-12-01", "PAID"),
  invoice("V28", "RA-S-02", "C12", 30_000, 20, "Y0-03-15", "PAID"),
  invoice("V29", "RA-S-03", "C13", 25_000, 20, "Y0-04-20", "PAID"),
  invoice("V30", "RA-S-04", "C14", 20_000, 10, "Y0-03-01", "PAID"),
  invoice("V31", "RA-S-05", "C14", 20_000, 10, "Y0-05-10", "ISSUED"),
  invoice("V32", "RA-2504", "C10", 15_000, 20, "Y0-01-10", "CANCELLED", true),
  invoice("V33", "GO-2601", "C15", 200_000, 20, "Y0-02-01", "PAID"),
  invoice("V34", "GO-2602", "C15", 150_000, 20, "Y0-04-01", "PAID"),
  invoice("V35", "GO-2603", "C15", 150_000, 20, "Y0-06-01", "ISSUED"),
  invoice("V36", "GO-S-01", "C16", 40_000, 20, "Y0-03-01", "PAID"),
  invoice("V37", "GO-S-02", "C16", 30_000, 20, "Y0-05-01", "ISSUED"),
  invoice("V38", "GO-S-03", "C17", 25_000, 0, "Y0-05-20", "DRAFT"),
  invoice("V39", "SH-2503", "C18", 40_000, 20, "Y-1-11-25", "ISSUED"),
];

/** DEMO-004 attachments; the original name is the invoice number. */
export const DEMO_ATTACHMENTS: readonly DemoAttachment[] = [
  { invoice: "V01", file: "demo-invoice-a.pdf", originalName: "LV-2401.pdf" },
  { invoice: "V11", file: "demo-invoice-b.pdf", originalName: "HL-2501.pdf" },
  { invoice: "V33", file: "demo-invoice-a.pdf", originalName: "GO-2601.pdf" },
];
