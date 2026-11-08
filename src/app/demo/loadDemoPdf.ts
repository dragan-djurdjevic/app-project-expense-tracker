// Spec: DEMO-004
import demoInvoiceA from "./assets/demo-invoice-a.pdf?url";
import demoInvoiceB from "./assets/demo-invoice-b.pdf?url";
import type { DemoPdfFile } from "./demoDataset";

const URLS: Record<DemoPdfFile, string> = {
  "demo-invoice-a.pdf": demoInvoiceA,
  "demo-invoice-b.pdf": demoInvoiceB,
};

/** DEMO-004: loads a bundled demo PDF (Vite `?url` import + `fetch`). */
export async function loadDemoPdf(file: DemoPdfFile): Promise<Uint8Array> {
  const response = await fetch(URLS[file]);
  if (!response.ok) throw new Error(`Cannot load ${file}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
