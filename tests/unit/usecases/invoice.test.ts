// Spec: DM-050, AR-005, BR-IVC-002, BR-IVC-004, BR-IVC-005, BR-IVC-006
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeInvoiceAmounts, INVOICE_STATUSES, type InvoiceInput } from "../../../src/core/domain/Invoice";
import { makeAttachInvoiceDocument } from "../../../src/core/usecases/invoice/attachInvoiceDocument";
import { makeChangeInvoiceStatus } from "../../../src/core/usecases/invoice/changeInvoiceStatus";
import { makeCreateInvoice } from "../../../src/core/usecases/invoice/createInvoice";
import { makeUpdateInvoice } from "../../../src/core/usecases/invoice/updateInvoice";
import { controlledClock } from "../../fixtures/controlledClock";
import { sequentialIds } from "../../fixtures/fixedClock";
import { InMemoryContractRepository } from "./InMemoryContractRepositories";
import {
  FakeDocumentStorage,
  InMemoryInvoiceRepository,
  InMemorySettingsRepository,
} from "./InMemoryInvoiceRepositories";

const TS = "2026-01-01T00:00:00.000Z";
const CONTRACT_ID = "40000000-0000-4000-8000-000000000001";
const OTHER_CONTRACT_ID = "40000000-0000-4000-8000-000000000002";
const fixture = (name: string) =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/files/${name}`, import.meta.url)));

async function setup(defaultVatRate = 2000) {
  const clock = controlledClock("2026-03-01T10:00:00.000Z");
  const ids = sequentialIds();
  const contractRepo = new InMemoryContractRepository(clock);
  const invoiceRepo = new InMemoryInvoiceRepository(clock);
  const settingsRepo = new InMemorySettingsRepository({ currency: "EUR", defaultVatRate });
  const documents = new FakeDocumentStorage();
  for (const id of [CONTRACT_ID, OTHER_CONTRACT_ID]) {
    await contractRepo.create({
      id,
      number: id === CONTRACT_ID ? "V-001" : "V-002",
      type: "INCOMING",
      projectId: "30000000-0000-4000-8000-000000000001",
      subcontractorId: null,
      value: 10_000_000,
      date: "2025-02-10",
      description: null,
      createdAt: TS,
      updatedAt: TS,
      archivedAt: null,
    });
  }
  return {
    clock,
    invoiceRepo,
    documents,
    createInvoice: makeCreateInvoice({ invoiceRepo, contractRepo, settingsRepo, clock, ids }),
    updateInvoice: makeUpdateInvoice({ invoiceRepo, contractRepo, clock }),
    changeInvoiceStatus: makeChangeInvoiceStatus({ invoiceRepo, clock }),
    attachInvoiceDocument: makeAttachInvoiceDocument({ invoiceRepo, documents, clock }),
  };
}

const input = (overrides: Partial<InvoiceInput> = {}): InvoiceInput => ({
  contractId: CONTRACT_ID,
  number: "INV-001",
  date: "2025-03-01",
  dueDate: null,
  value: 4_000_000,
  ...overrides,
});

describe("invoice use cases (DM-050)", () => {
  it("TC-M4-001 computeInvoiceAmounts rounds VAT half up", () => {
    expect(computeInvoiceAmounts(100000, 2000)).toEqual({ vatAmount: 20000, gross: 120000 });
    expect(computeInvoiceAmounts(333, 2000)).toEqual({ vatAmount: 67, gross: 400 });
    expect(computeInvoiceAmounts(5, 1000)).toEqual({ vatAmount: 1, gross: 6 });
  });

  it("TC-M4-002 invoice defaults: status DRAFT, vatRate = settings.defaultVatRate", async () => {
    const { createInvoice, invoiceRepo } = await setup(950);

    const result = await createInvoice(input());

    const expected = {
      id: "00000000-0000-4000-8000-000000000001",
      number: "INV-001",
      contractId: CONTRACT_ID,
      value: 4_000_000,
      vatRate: 950,
      date: "2025-03-01",
      dueDate: null,
      status: "DRAFT",
      description: null,
      attachment: null,
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
      archivedAt: null,
    };
    expect(result).toEqual({ ok: true, value: expected, warnings: [] });
    expect(await invoiceRepo.get(expected.id)).toEqual(expected);
  });

  it("TC-M4-004 update attempting to change contractId returns BR-IVC-002", async () => {
    const { createInvoice, updateInvoice, invoiceRepo } = await setup();
    const created = await createInvoice(input());
    if (!created.ok) throw new Error("setup failed");

    expect(await updateInvoice(created.value.id, input({ contractId: OTHER_CONTRACT_ID }))).toEqual({
      ok: false,
      error: { code: "BR-IVC-002", messageKey: "errors.immutable", field: "contractId" },
    });
    expect(await invoiceRepo.get(created.value.id)).toEqual(created.value);
  });

  it("TC-M4-006 dueDate before date returns BR-IVC-004; equal is ok", async () => {
    const { createInvoice, invoiceRepo } = await setup();

    expect(await createInvoice(input({ date: "2025-03-01", dueDate: "2025-02-28" }))).toEqual({
      ok: false,
      error: { code: "BR-IVC-004", messageKey: "errors.invoice.dueBeforeDate", field: "dueDate" },
    });
    expect(invoiceRepo.rows.size).toBe(0);
    expect(await createInvoice(input({ date: "2025-03-01", dueDate: "2025-03-01" }))).toMatchObject({
      ok: true,
      value: { date: "2025-03-01", dueDate: "2025-03-01" },
    });
  });

  it("TC-M4-007 status transitions: table-driven over all 16 pairs", async () => {
    const allowed = new Set([
      "DRAFT>ISSUED",
      "DRAFT>CANCELLED",
      "ISSUED>PAID",
      "ISSUED>CANCELLED",
      "ISSUED>DRAFT",
      "PAID>ISSUED",
    ]);
    let pairs = 0;
    for (const from of INVOICE_STATUSES) {
      for (const to of INVOICE_STATUSES) {
        pairs++;
        const { changeInvoiceStatus, invoiceRepo, clock } = await setup();
        const stored = {
          id: "50000000-0000-4000-8000-000000000001",
          number: "INV-001",
          contractId: CONTRACT_ID,
          value: 100,
          vatRate: 2000,
          date: "2025-03-01",
          dueDate: null,
          status: from,
          description: null,
          attachment: null,
          createdAt: TS,
          updatedAt: TS,
          archivedAt: null,
        };
        await invoiceRepo.create(stored);
        clock.set("2026-06-01T00:00:00.000Z");

        const result = await changeInvoiceStatus(stored.id, to);

        if (from === to) {
          expect(result, `${from}→${to}`).toEqual({ ok: true, value: stored });
          expect(await invoiceRepo.get(stored.id)).toEqual(stored);
        } else if (allowed.has(`${from}>${to}`)) {
          const changed = { ...stored, status: to, updatedAt: "2026-06-01T00:00:00.000Z" };
          expect(result, `${from}→${to}`).toEqual({ ok: true, value: changed });
          expect(await invoiceRepo.get(stored.id)).toEqual(changed);
        } else {
          expect(result, `${from}→${to}`).toEqual({
            ok: false,
            error: { code: "BR-IVC-005", field: "status", messageKey: "errors.invoice.statusTransition" },
          });
          expect(await invoiceRepo.get(stored.id)).toEqual(stored);
        }
      }
    }
    expect(pairs).toBe(16);
  });

  it("TC-M4-009 attach fake.pdf / image.png → notPdf; 20 971 521 bytes → tooLarge; exactly 20 971 520 bytes → ok", async () => {
    const { createInvoice, attachInvoiceDocument, documents } = await setup();
    const created = await createInvoice(input());
    if (!created.ok) throw new Error("setup failed");
    const id = created.value.id;
    const notPdf = {
      ok: false,
      error: { code: "BR-IVC-006", messageKey: "errors.attachment.notPdf", field: "attachment" },
    };
    const pdfOfSize = (size: number) => {
      const bytes = new Uint8Array(size);
      bytes.set(new TextEncoder().encode("%PDF-1.7"));
      return bytes;
    };

    expect(await attachInvoiceDocument(id, { name: "fake.pdf", bytes: fixture("fake.pdf") })).toEqual(notPdf);
    expect(await attachInvoiceDocument(id, { name: "image.png", bytes: fixture("image.png") })).toEqual(notPdf);
    expect(await attachInvoiceDocument(id, { name: "big.pdf", bytes: pdfOfSize(20_971_521) })).toEqual({
      ok: false,
      error: { code: "BR-IVC-006", messageKey: "errors.attachment.tooLarge", field: "attachment" },
    });
    expect(documents.files.size).toBe(0);

    const result = await attachInvoiceDocument(id, { name: "exact.pdf", bytes: pdfOfSize(20_971_520) });
    expect(result).toMatchObject({ ok: true, value: { attachment: { originalName: "exact.pdf" } } });
    expect(documents.files.size).toBe(1);
  });
});
