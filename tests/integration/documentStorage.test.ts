// Spec: AR-004, DS-004
import { describe, expect, it } from "vitest";
import { InMemoryDocumentStorage } from "../../src/adapters/storage/InMemoryDocumentStorage";
import { sequentialIds } from "../fixtures/fixedClock";

describe("InMemoryDocumentStorage (AR-004)", () => {
  it("TC-M1-016 save → exists true → remove → exists false", async () => {
    const storage = new InMemoryDocumentStorage(sequentialIds());
    const bytes = new TextEncoder().encode("%PDF-1.7 test");

    const ref = await storage.save(bytes, "Invoice 1.pdf", "invoice-1");

    expect(ref).toEqual({ path: "invoice-1/00000000-0000-4000-8000-000000000001.pdf", originalName: "Invoice 1.pdf" });
    expect(await storage.exists(ref)).toBe(true);
    await storage.remove(ref);
    expect(await storage.exists(ref)).toBe(false);
  });
});
