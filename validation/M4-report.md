# M4 validation — 2026-11-08 — spec 0.3.6 @ 05968a2 (HEAD bcbf8c9, implementation uncommitted in working tree)
Verdict: PASS-WITH-PENDING

Only open item: TC-M4-030 (manual, Tauri on Windows). Every automated TC, every gate and T1–T5 passed.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, lockfile unchanged |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 5 files, 23 tests passed |
| G4 `yarn test:integration` | PASS | 8 files, 39 tests passed |
| G4 `yarn test:e2e` | PASS | 24 tests passed (Chromium, browser mode) |
| G5 `yarn spec:trace M4` | PASS | "All automated test cases of M4 are traced." (M1–M3 also re-checked: pass) |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M4-001 | unit | PASS | tests/unit/usecases/invoice.test.ts:67 — exact `{vatAmount, gross}` for (100000,2000), (333,2000)→67/400, (5,1000)→1/6 |
| TC-M4-002 | unit | PASS | invoice.test.ts:73 — full record equality, status DRAFT, vatRate = settings 950, warnings `[]` |
| TC-M4-003 | integration | PASS | tests/integration/invoice.test.ts:63 — `{BR-GEN-006, errors.parentArchived, contractId}` / `{BR-IVC-001, errors.notFound, contractId}`, 0 rows |
| TC-M4-004 | unit | PASS | invoice.test.ts:97 — `{BR-IVC-002, errors.immutable, contractId}`, record unchanged |
| TC-M4-005 | integration | PASS | invoice.test.ts:78 — case-insensitive vs archived invoice, trimmed, update path; other contract ok |
| TC-M4-006 | unit | PASS | invoice.test.ts:109 — `{BR-IVC-004, …, dueDate}`; equal date ok |
| TC-M4-007 | unit | PASS | invoice.test.ts:123 — 16 pairs; 6 allowed persist with new updatedAt; 4 same-status return unchanged record; 6 others exact error `{BR-IVC-005, status, errors.invoice.statusTransition}` |
| TC-M4-008 | integration | PASS | invoice.test.ts:102 — path regex `^<id>/<uuid v4>.pdf$`, DB columns checked |
| TC-M4-009 | unit | PASS | invoice.test.ts:176 — fake.pdf/image.png → notPdf, 20 971 521 → tooLarge, 20 971 520 → ok, field `attachment` |
| TC-M4-010 | integration | PASS | invoice.test.ts:116 — old file gone after replace; remove nulls both columns and deletes file |
| TC-M4-011 | integration | PASS | invoice.test.ts:136 |
| TC-M4-012 | integration | PASS | invoice.test.ts:147 — sort, status array, direction, projectId, search by contract number, gross/vatAmount/direction |
| TC-M4-013 | integration | PASS | invoice.test.ts:191 — invoiced 51 230 / paid 51 000 (archived included, cancelled excluded) |
| TC-M4-014 | integration | PASS | invoice.test.ts:207 — exact summary object incl. archived invoice and archived contract |
| TC-M4-015 | integration | PASS | invoice.test.ts:234 — create and update paths, cancelled excluded |
| TC-M4-020 | e2e | PASS | tests/e2e/invoices.spec.ts:27 — exact option labels, €200.00 / €1,200.00 |
| TC-M4-021 | e2e | PASS | invoices.spec.ts:68 — options exactly `["Draft","Issued","Cancelled"]` (+ ISSUED edit case) |
| TC-M4-022 | e2e | PASS | invoices.spec.ts:85 |
| TC-M4-023 | e2e | PASS | invoices.spec.ts:107 — `error-attachment` = "The file must be a PDF." |
| TC-M4-024 | e2e | PASS | invoices.spec.ts:115 — `confirm-remove-attachment`, icon gone after save |
| TC-M4-025 | e2e | PASS | invoices.spec.ts:134 — boundary 20000 (no warn) / 20000.01 (warn, exact text) |
| TC-M4-026 | e2e | PASS | invoices.spec.ts:149 — computed colour equals Mantine red; PAID due date not red |
| TC-M4-027 | e2e | PASS | invoices.spec.ts:168 — cards €40,000.00 / €15,000.00 / €25,000.00, tab toolbar, reload after status change, picker limited to project |
| TC-M4-030 | manual | MANUAL | see below |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every .ts/.tsx/.sql under src/ starts with `// Spec:` and all IDs exist in spec/ (en.json is JSON, no header possible) |
| T2 Scope | PASS | working-tree changes (18 modified, 23 untracked, all under src/ and tests/) map to M4 IDs (DM-050, BR-IVC-*, DS-004, UI-050…053, UI-032, UI-001 placeholder removal, AR-004/005/009). `git diff a5dd7d2 HEAD` also contains commit 5b5c2b4 (M3, validated under M3). No changes to package.json, yarn.lock, src-tauri/ |
| T3 No-diff rule | N/A | M4 is `pending`; spec diff non-empty (0.3.6) |
| T4 Architecture | PASS | src/core has no imports outside src/core; src/ui has no imports from src/adapters; ui imports core/domain as types only; dependencies equal AR-006a |
| T5 i18n | PASS | no literal text in JSX/props under the changed UI files; only "—" and the spec-defined 📎 symbol |

Spot review of business rules:
- BR-IVC-005: `TRANSITIONS` table in src/core/domain/Invoice.ts:90 matches the 6 allowed transitions; create checks against DRAFT; update/changeStatus against stored status; same status is a no-op in changeInvoiceStatus.ts:34. Matches.
- BR-IVC-006: `validateAttachment` (Invoice.ts:154) checks extension + `%PDF-` first, then `> 20 971 520`. Matches.
- BR-IVC-008: `invoiceWarnings` (checkInvoiceReferences.ts:23) sums non-cancelled invoices incl. archived after the save and compares `>` contract value. Matches.

## Findings
None block the verdict. Behaviour the code implements that the spec does not define (R6 guesses), for possible spec amendment:
1. Low DM-050/AR-005 — `updateInvoice` keeps the stored `vatRate`/`status` when the input omits them (spec defines defaults only for create) — src/core/usecases/invoice/updateInvoice.ts:36.
2. Low BR-GEN-006/BR-IVC-001 — `updateInvoice` does not re-check the contract reference, so an invoice whose contract was archived later can still be edited. This fits "existing references stay valid" but the spec does not say it for invoices (BR-CON-002 says it only for contracts) — updateInvoice.ts header.
3. Low BR-IVC-007 — `removeInvoiceDocument` on an invoice without an attachment is a no-op success; `openInvoiceDocument` without an attachment throws. Neither is defined — removeInvoiceDocument.ts:28, openInvoiceDocument.ts:19.
4. Low UI-053 — confirm dialog title "Remove attachment" and message "Remove the attachment “{{name}}”?" are invented; spec only names `confirm-remove-attachment` — src/ui/i18n/en.json (`entity.invoice.confirmRemove`).
5. Info UI-050 — invoice status badge colours (Draft gray, Issued blue, Paid green, Cancelled red) are not specified — src/ui/components/StatusBadge.tsx.
6. Info UI-051 — in the create form a chosen file is saved by a second call after `createInvoice`. If storage fails at that point the invoice already exists and Save again would hit BR-IVC-003. Unlikely because the file is pre-validated — src/ui/screens/Invoices/InvoiceForm.tsx:170-176.
7. Info DS-004/AR-009 — capability `opener:allow-open-path` is scoped to `$APPDATA/**`, and fs `default` scope covers the app dirs. With `ARCHTRACKER_DATA_DIR` set to another location, writing or opening documents may be denied. This does not affect TC-M4-030 (it uses the default dir) — src-tauri/capabilities/default.json.
8. Info M4 fixture — the browser fixture loads sample.pdf through `?raw` + `TextEncoder`. This only works because sample.pdf is pure ASCII (checked) — tests/fixtures/basic.ts.
9. Info TC-M4-007 — tests the 16 pairs through `changeStatus` only; the `updateInvoice` transition path is covered indirectly (TC-M4-027 e2e). The TC does not require more.

## Manual steps for the user
TC-M4-030 (Windows, Tauri mode, installed app):
1. Install and start the app normally (no `ARCHTRACKER_DATA_DIR`).
2. Create an investor, project, INCOMING contract and an invoice; in the invoice form click "Attach PDF", choose a real PDF, Save.
3. Confirm the 📎 icon appears in the Invoices list; open the invoice and click the file name link → the PDF opens in the OS default PDF viewer. Clicking the 📎 icon in the list should do the same.
4. In Explorer, open `%APPDATA%\com.archtracker.app\documents\` and confirm a folder named after the invoice id containing `<uuid>.pdf`.
5. Optional: Replace the PDF and confirm the old file is gone; Remove it and confirm the folder no longer contains the file.
