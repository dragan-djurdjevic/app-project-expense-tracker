# sync 0.3.7 validation — 2026-11-08 — spec 0.3.7 @ cb38d31
Verdict: PASS-WITH-PENDING

Scope: spec diff `05968a2..HEAD -- spec/` (0.3.6 → 0.3.7, PATCH clarification): DM-050, AR-004, UI-053, M4 deliverable
`sample.pdf`. Regression over all `done` milestones M1–M4. Branch `mx/m4-invoices`, working tree clean, no code
change since the spec commit (`git diff --stat cb38d31 HEAD` empty). I checked each clarified behaviour against the
existing code myself, and the code already does what the clarified text says, so no code change was needed.
Open items: TC-M1-032 (PENDING-CI, branch not pushed) and TC-M4-030 (MANUAL).

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, lockfile unchanged |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 5 files, 23 tests passed |
| G4 `yarn test:integration` | PASS | 8 files, 39 tests passed |
| G4 `yarn test:e2e` | PASS | 24 tests passed (Chromium, browser mode) |
| G5 `yarn spec:trace M1` / `M2` / `M3` / `M4` | PASS | each: "All automated test cases of Mx are traced." |

## Clarified behaviours (spec diff) — code check
| Spec item | Clarified behaviour | Result | Evidence |
|---|---|---|---|
| DM-050 | create: omitted/null `vatRate` = settings.defaultVatRate, omitted `status` = DRAFT | PASS | createInvoice.ts passes `{vatRate: settings.defaultVatRate, status: DRAFT}` as defaults; Invoice.ts:191 `input.vatRate ?? defaults.vatRate`, :193-194 empty/null status → default; TC-M4-002 |
| DM-050 | update: omitted/null `vatRate` / omitted `status` keeps stored value | PASS | updateInvoice.ts passes `{vatRate: existing.vatRate, status: existing.status}` as defaults |
| DM-050 / BR-GEN-006 | `contractId` not re-checked on update (invoice stays editable after its contract/project is archived) | PASS | updateInvoice.ts does not call `checkContractReference`; only checks BR-GEN-007 (invoice archived) and BR-IVC-002 (contract change) |
| DM-050 | `removeDocument` without attachment = no-op success | PASS | removeInvoiceDocument.ts: `if (!existing.attachment) return ok(existing)` (after the BR-GEN-007 check) |
| DM-050 / AR-005 | `openDocument` without attachment throws | PASS | openInvoiceDocument.ts: `throw new Error("Invoice has no attachment: …")` |
| AR-004 | `listInvoices` adds `overdue` from Clock's local date | PASS | listInvoices.ts: `localDateOnly(clock.now())` + `isInvoiceOverdue` (ISSUED and dueDate < today); repository list has no overdue |
| UI-053 | file checked against BR-IVC-006 when chosen; error shown at once; file not kept | PASS | InvoiceForm.tsx:144-152 `pick` → `checkInvoiceAttachment`, `form.showError`, returns before `setAttachment`; TC-M4-023 asserts error with no Save |
| UI-053 | save order: invoice created/updated first, then file stored/removed | PASS | InvoiceForm.tsx:170-176 create/update → `attachInvoiceDocument` / `removeInvoiceDocument` |
| UI-053 | remove confirm: title "Remove attachment", message "Remove the attachment “{{name}}”?", buttons "Remove"/"Cancel" | PASS | AttachmentBlock.tsx ConfirmDialog with `entity.invoice.confirmRemove.*`, confirm label `entity.invoice.remove` ("Remove"), cancel `common.cancel` ("Cancel"); en.json:131-134, :12 |
| UI-053 | empty VAT field sent as null | PASS | InvoiceForm.tsx:166 `values.vatRate.trim() === "" ? null : …` |
| M4 deliverable | `sample.pdf` valid, < 100 KB, ASCII-only | PASS | 589 bytes, starts `%PDF-1.4`, 0 non-ASCII bytes (`LC_ALL=C grep -c '[^ -~\t]'` → 0); loaded via `?raw` in tests/fixtures/basic.ts:51 |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M1-001 | unit | PASS | tests/unit/domain/valueObjects.test.ts:10 |
| TC-M1-002 | unit | PASS | valueObjects.test.ts:21 |
| TC-M1-003 | unit | PASS | valueObjects.test.ts:30 |
| TC-M1-004 | unit | PASS | valueObjects.test.ts:40 |
| TC-M1-005 | unit | PASS | valueObjects.test.ts:46 |
| TC-M1-006 | unit | PASS | tests/unit/format/format.test.ts:9 |
| TC-M1-007 | unit | PASS | format.test.ts:23 |
| TC-M1-008 | unit | PASS | format.test.ts:29 |
| TC-M1-009 | unit | PASS | format.test.ts:33 |
| TC-M1-010 | integration | PASS | tests/integration/migrations.test.ts:31, :43 |
| TC-M1-011 | integration | PASS | migrations.test.ts:54 |
| TC-M1-012 | integration | PASS | migrations.test.ts:64 |
| TC-M1-013 | integration | PASS | migrations.test.ts:69 |
| TC-M1-014 | integration | PASS | tests/integration/settings.test.ts:21 |
| TC-M1-015 | integration | PASS | settings.test.ts:32 |
| TC-M1-016 | integration | PASS | tests/integration/documentStorage.test.ts:7 |
| TC-M1-020 | e2e | PASS | tests/e2e/shell.spec.ts:49 |
| TC-M1-021 | e2e | PASS | shell.spec.ts:70 |
| TC-M1-022 | e2e | PASS | shell.spec.ts:82 |
| TC-M1-023 | e2e | PASS | shell.spec.ts:107 |
| TC-M1-024 | lint | PASS | probe `src/core/__boundary_probe.ts` importing `../adapters/sqlite/SqliteInvoiceRepository` → `yarn lint` exit 1 (`boundaries/dependencies`: "core-other" → "adapters"); probe deleted; `yarn lint` exit 0; tree clean |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0 with `$(brew --prefix llvm)/bin` on PATH as README.md:26-27 says: Node v22.23.3, Corepack 0.36.0, Yarn 4.18.1 = packageManager, rustc/cargo 1.99.1, targets aarch64/x86_64-apple-darwin + x86_64-pc-windows-msvc, Xcode CLT, cargo-xwin 0.23.1, makensis v3.13, Homebrew clang 23.1.5, llvm-lib, LLD 23.1.5, sqlite3 3.54.0. Note: the agent's default PATH (cargo dirs only) reports "llvm: clang / llvm-lib MISSING" (exit 1); the tools are installed at /opt/homebrew/opt/llvm/bin |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0: "app alive, tracker.db created, migration version 1 recorded … PASS" |
| TC-M1-031 | local | PASS | `yarn build:win-cross` exit 0; `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Architecture Project Tracker_0.1.0_x64-setup.exe` 3 812 837 bytes (> 1 MB) |
| TC-M1-032 | ci | PENDING-CI | branch `mx/m4-invoices` not on origin (only main, m1–m3, spec/initial); no `windows-build` run |
| TC-M2-001 | unit | PASS | tests/unit/usecases/investor.test.ts:24 |
| TC-M2-002 | unit | PASS | investor.test.ts:50 |
| TC-M2-003 | unit | PASS | investor.test.ts:64 |
| TC-M2-004 | integration | PASS | tests/integration/investor.test.ts:8 |
| TC-M2-005 | integration | PASS | investor.test.ts:26 |
| TC-M2-006 | integration | PASS | investor.test.ts:54 |
| TC-M2-007 | integration | PASS | investor.test.ts:74 |
| TC-M2-008 | unit | PASS | tests/unit/usecases/investor.test.ts:74 |
| TC-M2-009 | integration | PASS | tests/integration/investor.test.ts:88 |
| TC-M2-010 | integration | PASS | tests/integration/subcontractor.test.ts:6 |
| TC-M2-011 | integration | PASS | subcontractor.test.ts:70 |
| TC-M2-020 | integration | PASS | tests/integration/project.test.ts:14 |
| TC-M2-021 | integration | PASS | project.test.ts:47 |
| TC-M2-022 | integration | PASS | project.test.ts:62 |
| TC-M2-023 | integration | PASS | project.test.ts:98 |
| TC-M2-024 | integration | PASS | project.test.ts:112 |
| TC-M2-025 | integration | PASS | project.test.ts:159 |
| TC-M2-026 | integration | PASS | tests/integration/investor.test.ts:108 |
| TC-M2-030 | e2e | PASS | tests/e2e/investors.spec.ts:5 |
| TC-M2-031 | e2e | PASS | investors.spec.ts:55 |
| TC-M2-032 | e2e | PASS | tests/e2e/subcontractors.spec.ts:5 |
| TC-M2-033 | e2e | PASS | tests/e2e/projects.spec.ts:10 |
| TC-M2-034 | e2e | PASS | projects.spec.ts:42 |
| TC-M2-035 | e2e | PASS | projects.spec.ts:73 |
| TC-M2-036 | e2e | PASS | projects.spec.ts:97 |
| TC-M3-001 | unit | PASS | tests/unit/usecases/contract.test.ts:72 |
| TC-M3-002 | unit | PASS | contract.test.ts:94 |
| TC-M3-003 | unit | PASS | contract.test.ts:104 |
| TC-M3-004 | integration | PASS | tests/integration/contract.test.ts:40 |
| TC-M3-005 | integration | PASS | contract.test.ts:55 |
| TC-M3-006 | integration | PASS | contract.test.ts:74 |
| TC-M3-007 | unit | PASS | tests/unit/usecases/contract.test.ts:121 |
| TC-M3-008 | integration | PASS | tests/integration/contract.test.ts:97 |
| TC-M3-009 | integration | PASS | contract.test.ts:140 |
| TC-M3-010 | integration | PASS | contract.test.ts:175 |
| TC-M3-011 | integration | PASS | contract.test.ts:213 |
| TC-M3-012 | integration | PASS | contract.test.ts:256 |
| TC-M3-020 | e2e | PASS | tests/e2e/contracts.spec.ts:17 |
| TC-M3-021 | e2e | PASS | contracts.spec.ts:56 |
| TC-M3-022 | e2e | PASS | contracts.spec.ts:88 |
| TC-M3-023 | e2e | PASS | contracts.spec.ts:118 |
| TC-M3-024 | e2e | PASS | contracts.spec.ts:148 |
| TC-M4-001 | unit | PASS | tests/unit/usecases/invoice.test.ts:67 — exact `{vatAmount, gross}` for all three spec pairs |
| TC-M4-002 | unit | PASS | invoice.test.ts:73 — full record equality, status DRAFT, vatRate = settings 950 |
| TC-M4-003 | integration | PASS | tests/integration/invoice.test.ts:63 — BR-GEN-006 / not found, 0 rows |
| TC-M4-004 | unit | PASS | invoice.test.ts:97 — `{BR-IVC-002, errors.immutable, contractId}`, record unchanged |
| TC-M4-005 | integration | PASS | invoice.test.ts:78 — case-insensitive incl. archived; other contract ok |
| TC-M4-006 | unit | PASS | invoice.test.ts:109 — BR-IVC-004; equal ok |
| TC-M4-007 | unit | PASS | invoice.test.ts:123 — 16 pairs, 6 allowed persisted, 4 same-status no-op, 6 exact error objects |
| TC-M4-008 | integration | PASS | invoice.test.ts:102 — path `^<id>/<uuid>.pdf$`, original name, columns |
| TC-M4-009 | unit | PASS | invoice.test.ts:176 — notPdf ×2, 20 971 521 tooLarge, 20 971 520 ok |
| TC-M4-010 | integration | PASS | invoice.test.ts:116 — old file removed on replace; remove clears columns and file |
| TC-M4-011 | integration | PASS | invoice.test.ts:136 |
| TC-M4-012 | integration | PASS | invoice.test.ts:147 — status/direction/projectId/search, exact id order, gross/direction |
| TC-M4-013 | integration | PASS | invoice.test.ts:191 — invoiced 51 230 / paid 51 000 |
| TC-M4-014 | integration | PASS | invoice.test.ts:207 — exact summary equality |
| TC-M4-015 | integration | PASS | invoice.test.ts:234 — `warnings: ["overInvoiced"]`, row persisted |
| TC-M4-020 | e2e | PASS | tests/e2e/invoices.spec.ts:27 — picker labels, VAT €200.00, gross €1,200.00 |
| TC-M4-021 | e2e | PASS | invoices.spec.ts:68 — options `["Draft","Issued","Cancelled"]` |
| TC-M4-022 | e2e | PASS | invoices.spec.ts:85 |
| TC-M4-023 | e2e | PASS | invoices.spec.ts:107 — "The file must be a PDF." shown on choose, no link |
| TC-M4-024 | e2e | PASS | invoices.spec.ts:115 |
| TC-M4-025 | e2e | PASS | invoices.spec.ts:134 |
| TC-M4-026 | e2e | PASS | invoices.spec.ts:149 — computed color red vs not red |
| TC-M4-027 | e2e | PASS | invoices.spec.ts:168 — €40,000.00 / €15,000.00 / €25,000.00 |
| TC-M4-030 | manual | MANUAL | see below |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 `// Spec:` headers | PASS | all 131 tracked files under `src/` have a header; all 72 distinct IDs exist in `spec/` |
| T2 code diff since specCommit 05968a2 maps to scope | PASS | `dcf1455` = M4 implementation (M4 IDs, validated in validation/M4-report.md); `bcbf8c9` touches only `.claude/agents/implementer.md` and `docs/conventions.md` (not code); `cb38d31` = spec only. No untracked files |
| T3 empty spec diff ⇒ no code diff | N/A / PASS | spec diff is not empty (0.3.7). No code was changed for it, and that is correct because the code already does what the clarified text says (table above) |
| T4 architecture | PASS | no imports out of `src/core`; no `adapters` imports in `src/ui`; package.json unchanged since specCommit and its deps all appear in AR-006; boundary lint probe fails as expected |
| T5 i18n | PASS | grep for literal JSX text and literal `label/title/placeholder/message/aria-label` attributes in `src/ui` → none; confirm-dialog texts come from en.json |

Spot review of business rules: BR-GEN-006 (checkInvoiceReferences.ts: unknown → BR-IVC-001 notFound, archived →
parentArchived on `contractId`; used on create only, as DM-050 0.3.7 says), BR-IVC-006 (Invoice.ts:154-162: extension
plus `%PDF-` magic → notPdf, then > 20 971 520 → tooLarge), BR-IVC-007 (removeInvoiceDocument clears the ref and deletes
the file; attach replaces and removes the previous file, TC-M4-010). All three match the BR text.

## Findings
1. Low — DM-050 / UI-053 (0.3.7) — no automated TC covers the new clarifications: update keeps vatRate/status when they are omitted, update allowed on an archived contract, `removeDocument` no-op, `openDocument` throws, the confirm-dialog texts, and empty VAT → null. The code is correct, but only code reading confirms it. The spec could add TCs for these in a later version. Not a failure, because the TC list did not change.
2. Info — TC-M1-025 environment — `check:env` passes only when `$(brew --prefix llvm)/bin` is on PATH (README.md:26-27). The agent's default PATH and the documented cargo prefix do not include it.
3. Info — spec-lock.json still shows `specVersion 0.3.6` / `specCommit 05968a2`. The main session updates it after this validation (R7.4/R7.5).

## Manual steps for the user
- **TC-M4-030 (Windows, Tauri mode):** install `Architecture Project Tracker_0.1.0_x64-setup.exe`, open an invoice, attach
  a PDF, Save, click the file name link. It should open in the default PDF viewer, and the file should be under
  `%APPDATA%\com.archtracker.app\documents\<invoiceId>\`.
- **TC-M1-032 (CI):** if you approve, push `mx/m4-invoices` and check that the `windows-build` workflow passes
  (silent install, app alive with `ARCHTRACKER_DATA_DIR`, `tracker.db` migration version 1, uninstall).
