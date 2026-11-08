// Spec: DM-050, BR-IVC-001, BR-IVC-003, BR-IVC-006, BR-IVC-007, BR-IVC-008, BR-GEN-006, UI-040, UI-050, UI-032, AR-004, DS-004
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { InvoiceInput } from "../../src/core/domain/Invoice";
import { setupServices, value } from "../fixtures/services";

const UNKNOWN_ID = "99999999-0000-4000-8000-000000000000";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const file = (name: string) => ({
  name,
  bytes: new Uint8Array(readFileSync(new URL(`../fixtures/files/${name}`, import.meta.url))),
});

async function withParents() {
  const s = await setupServices();
  const alpha = value(await s.createInvestor({ name: "Alpha Invest", vatNumber: "ALPHA001" }));
  const struct = value(await s.createSubcontractor({ name: "Struct Eng", vatNumber: "STRUCT01" }));
  const villa = value(await s.createProject({ name: "Villa Lake", investorId: alpha.id }));
  const tower = value(await s.createProject({ name: "Office Tower", investorId: alpha.id }));
  const villaIn = value(
    await s.createContract({
      type: "INCOMING",
      projectId: villa.id,
      number: "V-001",
      date: "2025-02-10",
      value: 10_000_000,
    }),
  );
  const villaOut = value(
    await s.createContract({
      type: "OUTGOING",
      projectId: villa.id,
      subcontractorId: struct.id,
      number: "V-OUT-1",
      date: "2025-03-15",
      value: 3_000_000,
    }),
  );
  const towerIn = value(
    await s.createContract({
      type: "INCOMING",
      projectId: tower.id,
      number: "T-001",
      date: "2025-05-01",
      value: 50_000_000,
    }),
  );
  const invoice = (input: Partial<InvoiceInput> = {}): InvoiceInput => ({
    contractId: villaIn.id,
    number: "INV-001",
    date: "2025-03-01",
    dueDate: null,
    value: 4_000_000,
    vatRate: 2000,
    status: "DRAFT",
    description: null,
    ...input,
  });
  return { ...s, alpha, struct, villa, tower, villaIn, villaOut, towerIn, invoice };
}

describe("invoices on SQLite (DM-050)", () => {
  it("TC-M4-003 create on archived contract returns BR-GEN-006; unknown contract returns not found", async () => {
    const s = await withParents();
    await s.archiveContract(s.villaIn.id);

    expect(await s.createInvoice(s.invoice())).toEqual({
      ok: false,
      error: { code: "BR-GEN-006", messageKey: "errors.parentArchived", field: "contractId" },
    });
    expect(await s.createInvoice(s.invoice({ contractId: UNKNOWN_ID }))).toEqual({
      ok: false,
      error: { code: "BR-IVC-001", messageKey: "errors.notFound", field: "contractId" },
    });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM invoice")).toEqual([{ n: 0 }]);
  });

  it("TC-M4-005 duplicate number on same contract (case-insensitive, incl. archived) returns BR-IVC-003; another contract is ok", async () => {
    const s = await withParents();
    const first = value(await s.createInvoice(s.invoice({ number: "INV-001" })));
    await s.archiveInvoice(first.id);
    const duplicate = {
      ok: false,
      error: { code: "BR-IVC-003", messageKey: "errors.invoice.numberDuplicate", field: "number" },
    };

    expect(await s.createInvoice(s.invoice({ number: "inv-001" }))).toEqual(duplicate);
    expect(await s.createInvoice(s.invoice({ number: " INV-001 " }))).toEqual(duplicate);
    expect(await s.createInvoice(s.invoice({ contractId: s.villaOut.id, number: "inv-001" }))).toMatchObject({
      ok: true,
      value: { contractId: s.villaOut.id, number: "inv-001" },
    });

    const second = value(await s.createInvoice(s.invoice({ number: "INV-002" })));
    expect(await s.updateInvoice(second.id, s.invoice({ number: "INV-001" }))).toEqual(duplicate);
    expect(await s.updateInvoice(second.id, s.invoice({ number: "inv-002" }))).toMatchObject({
      ok: true,
      value: { number: "inv-002" },
    });
  });

  it("TC-M4-008 attach valid PDF stores it as <invoiceId>/<uuid>.pdf with the original name", async () => {
    const s = await withParents();
    const created = value(await s.createInvoice(s.invoice()));

    const attached = value(await s.attachInvoiceDocument(created.id, file("sample.pdf")));

    expect(attached.attachment?.originalName).toBe("sample.pdf");
    expect(attached.attachment?.path).toMatch(new RegExp(`^${created.id}/${UUID}\\.pdf$`));
    expect(await s.documents.exists(attached.attachment!)).toBe(true);
    expect(
      await s.db.select("SELECT attachment_path, attachment_name FROM invoice WHERE id = ?", [created.id]),
    ).toEqual([{ attachment_path: attached.attachment?.path, attachment_name: "sample.pdf" }]);
  });

  it("TC-M4-010 replacing removes the previous file; removing clears both columns and deletes the file", async () => {
    const s = await withParents();
    const created = value(await s.createInvoice(s.invoice()));
    const first = value(await s.attachInvoiceDocument(created.id, file("sample.pdf"))).attachment!;

    const second = value(
      await s.attachInvoiceDocument(created.id, { ...file("sample.pdf"), name: "v2.PDF" }),
    ).attachment!;
    expect(second).toMatchObject({ originalName: "v2.PDF" });
    expect(second.path).not.toBe(first.path);
    expect(await s.documents.exists(first)).toBe(false);
    expect(await s.documents.exists(second)).toBe(true);

    expect(value(await s.removeInvoiceDocument(created.id)).attachment).toBeNull();
    expect(await s.documents.exists(second)).toBe(false);
    expect(
      await s.db.select("SELECT attachment_path, attachment_name FROM invoice WHERE id = ?", [created.id]),
    ).toEqual([{ attachment_path: null, attachment_name: null }]);
  });

  it("TC-M4-011 archiving an invoice keeps its attachment file", async () => {
    const s = await withParents();
    const created = value(await s.createInvoice(s.invoice()));
    const ref = value(await s.attachInvoiceDocument(created.id, file("sample.pdf"))).attachment!;

    expect(await s.archiveInvoice(created.id)).toEqual({ ok: true, value: undefined });

    expect(await s.documents.exists(ref)).toBe(true);
    expect(value(await s.getInvoice(created.id))).toMatchObject({ attachment: ref, archivedAt: expect.any(String) });
  });

  it("TC-M4-012 list filters status, direction, projectId; search by contract number; returns gross and direction", async () => {
    const s = await withParents();
    const a = value(await s.createInvoice(s.invoice({ number: "A-1", date: "2025-03-01", status: "ISSUED" })));
    const b = value(await s.createInvoice(s.invoice({ number: "B-1", date: "2025-04-01", value: 333 })));
    const c = value(
      await s.createInvoice(
        s.invoice({ contractId: s.villaOut.id, number: "C-1", date: "2025-03-01", status: "ISSUED" }),
      ),
    );
    const d = value(await s.createInvoice(s.invoice({ contractId: s.towerIn.id, number: "D-1", date: "2025-05-01" })));
    const ids = (result: { ok: true; value: { id: string }[] } | { ok: false; error: unknown }) =>
      value(result).map((row) => row.id);

    // Default sort: date desc, number asc, id.
    expect(ids(await s.listInvoices())).toEqual([d.id, b.id, a.id, c.id]);
    expect(ids(await s.listInvoices({ status: ["ISSUED"] }))).toEqual([a.id, c.id]);
    expect(ids(await s.listInvoices({ status: ["ISSUED", "DRAFT"] }))).toEqual([d.id, b.id, a.id, c.id]);
    expect(ids(await s.listInvoices({ direction: "OUTGOING" }))).toEqual([c.id]);
    expect(ids(await s.listInvoices({ direction: "INCOMING" }))).toEqual([d.id, b.id, a.id]);
    expect(ids(await s.listInvoices({ projectId: s.tower.id }))).toEqual([d.id]);
    expect(ids(await s.listInvoices({ search: "v-out" }))).toEqual([c.id]);
    expect(ids(await s.listInvoices({ search: "t-00" }))).toEqual([d.id]);

    const rowB = value(await s.listInvoices({ search: "B-1" }))[0];
    expect(rowB).toMatchObject({
      contractNumber: "V-001",
      projectId: s.villa.id,
      projectName: "Villa Lake",
      direction: "INCOMING",
      value: 333,
      vatAmount: 67,
      gross: 400,
    });
    expect(value(await s.listInvoices({ search: "C-1" }))[0]).toMatchObject({
      direction: "OUTGOING",
      vatAmount: 800_000,
      gross: 4_800_000,
    });

    await s.archiveInvoice(d.id);
    expect(ids(await s.listInvoices({ projectId: s.tower.id }))).toEqual([]);
    expect(ids(await s.listInvoices({ projectId: s.tower.id, includeArchived: true }))).toEqual([d.id]);
  });

  it("TC-M4-013 contracts list Invoiced = Σ non-cancelled invoice net; Paid = Σ PAID invoice net", async () => {
    const s = await withParents();
    const paid = value(await s.createInvoice(s.invoice({ number: "P", value: 1_000, status: "ISSUED" })));
    value(await s.changeInvoiceStatus(paid.id, "PAID"));
    value(await s.createInvoice(s.invoice({ number: "I", value: 200, status: "ISSUED" })));
    value(await s.createInvoice(s.invoice({ number: "D", value: 30, status: "DRAFT" })));
    value(await s.createInvoice(s.invoice({ number: "X", value: 4, status: "CANCELLED" })));
    const archived = value(await s.createInvoice(s.invoice({ number: "A", value: 50_000, status: "ISSUED" })));
    value(await s.changeInvoiceStatus(archived.id, "PAID"));
    await s.archiveInvoice(archived.id);

    const contracts = value(await s.listContracts({ projectId: s.villa.id }));
    expect(contracts.find((c) => c.id === s.villaIn.id)).toMatchObject({ invoiced: 51_230, paid: 51_000 });
    expect(contracts.find((c) => c.id === s.villaOut.id)).toMatchObject({ invoiced: 0, paid: 0 });
  });

  it("TC-M4-014 project summary: collected = Σ PAID INCOMING, paid to subs = Σ PAID OUTGOING, net = difference", async () => {
    const s = await withParents();
    const make = async (contractId: string, number: string, amount: number, status: string, toPaid = false) => {
      const created = value(await s.createInvoice(s.invoice({ contractId, number, value: amount, status })));
      if (toPaid) value(await s.changeInvoiceStatus(created.id, "PAID"));
      return created;
    };
    await make(s.villaIn.id, "IN-P", 4_000_000, "ISSUED", true);
    const archivedPaid = await make(s.villaIn.id, "IN-PA", 100, "ISSUED", true);
    await s.archiveInvoice(archivedPaid.id);
    await make(s.villaIn.id, "IN-I", 3_000_000, "ISSUED");
    await make(s.villaIn.id, "IN-D", 1_000_000, "DRAFT");
    await make(s.villaIn.id, "IN-C", 500_000, "CANCELLED");
    await make(s.villaOut.id, "OUT-P", 1_500_000, "ISSUED", true);
    await make(s.villaOut.id, "OUT-I", 700_000, "ISSUED");
    await make(s.towerIn.id, "T-P", 9_000_000, "ISSUED", true);
    await s.archiveContract(s.villaOut.id);

    expect(value(await s.getProject(s.villa.id))?.summary).toEqual({
      contracted: 10_000_000,
      collected: 4_000_100,
      contractedOut: 3_000_000,
      paidOut: 1_500_000,
      net: 2_500_100,
    });
  });

  it("TC-M4-015 over-invoicing returns ok with warnings ['overInvoiced']", async () => {
    const s = await withParents();

    expect(await s.createInvoice(s.invoice({ number: "1", value: 10_000_000 }))).toMatchObject({
      ok: true,
      warnings: [],
    });
    const cancelled = await s.createInvoice(s.invoice({ number: "2", value: 5, status: "CANCELLED" }));
    expect(cancelled).toMatchObject({ ok: true, warnings: [] });
    const over = await s.createInvoice(s.invoice({ number: "3", value: 1 }));
    expect(over).toMatchObject({ ok: true, value: { number: "3", value: 1 }, warnings: ["overInvoiced"] });
    expect(await s.db.select("SELECT COUNT(*) AS n FROM invoice")).toEqual([{ n: 3 }]);

    const third = value(over);
    expect(await s.updateInvoice(third.id, s.invoice({ number: "3", value: 0 }))).toMatchObject({
      ok: true,
      warnings: [],
    });
    expect(await s.updateInvoice(third.id, s.invoice({ number: "3", value: 2 }))).toMatchObject({
      ok: true,
      warnings: ["overInvoiced"],
    });
  });
});
