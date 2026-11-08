# M3 validation — 2026-11-08 — spec 0.3.5 @ a5dd7d2
Verdict: PASS

Branch `mx/m3-contracts`, HEAD `a5dd7d2 docs(spec): clarify m3 contract edge cases (v0.3.5)`. The M3 implementation is
uncommitted in the working tree: 15 modified files and 7 untracked paths under `src/` and `tests/`. `spec/` has no
uncommitted changes. `spec-lock.json` has `specCommit = 8b0fb0b` (0.3.4), M1 and M2 `done`, M3 `pending`. Scope = the full
M3 spec plus the 0.3.5 spec diff (`git diff 8b0fb0b HEAD -- spec/`): AR-004 (`existsByNumber`, `ContractListItem`),
AR-005 (validation order), BR-CON-001…005, BR-IVC-008 (wording only), UI-032 (Contracts tab), UI-040, UI-041, UI-052
(wording only), and the M3 fixture rows. M3 has no `lint`, `local`, `ci` or `manual` TCs. As a regression check, every M1
and M2 TC was re-run, including the M1 lint and local TCs. Environment: Node v22.23.3 (nvm), Yarn 4.18.1, rustc 1.99.1.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0; `yarn.lock` unchanged (`git status` clean for it) |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0, 0 problems |
| G4 `yarn test:unit` | PASS | 4 files, 17 tests passed (13 M1/M2 + 4 M3) |
| G4 `yarn test:integration` | PASS | 7 files, 30 tests passed (22 M1/M2 + 8 M3) |
| G4 `yarn test:e2e` | PASS | e2e build + Playwright Chromium: 16 tests passed (11 M1/M2 + 5 M3) |
| G5 `yarn spec:trace M3` | PASS | exit 0, "All automated test cases of M3 are traced." (17/17). `spec:trace M1` and `spec:trace M2` also exit 0 |
| Prettier (read-only `--check src tests`) | PASS | "All matched files use Prettier code style!" |

The counts are the M2 baseline (13 / 22 / 11) plus exactly the new M3 tests, so no earlier test was removed.

## Test cases
| TC | Level | Result | Evidence (test file:line or command) |
|---|---|---|---|
| TC-M3-001 | unit | PASS | tests/unit/usecases/contract.test.ts:72. Exact entity: id from IdGenerator, number trimmed, blank description → null, subcontractorId null, timestamps from Clock, archivedAt null; the repo row matches too |
| TC-M3-002 | unit | PASS | contract.test.ts:94. Exact `{BR-CON-003, errors.contract.subcontractorForbidden, field:"subcontractorId"}`; nothing is persisted |
| TC-M3-003 | unit | PASS | contract.test.ts:104. null / undefined / blank give exact `{BR-CON-002, errors.contract.subcontractorRequired, field:"subcontractorId"}`; checked before `number` (AR-005 field order); nothing is persisted |
| TC-M3-004 | integration | PASS | tests/integration/contract.test.ts:40. Archived subcontractor → `{BR-GEN-006, errors.parentArchived, subcontractorId}`; unknown → `{BR-CON-002, errors.notFound, subcontractorId}`; 0 rows |
| TC-M3-005 | integration | PASS | contract.test.ts:55. Archived project → `{BR-GEN-006, errors.parentArchived, projectId}` for INCOMING and OUTGOING; unknown → `{BR-CON-001, errors.notFound, projectId}`; 0 rows |
| TC-M3-006 | integration | PASS | contract.test.ts:74. `v-001` and ` V-001 ` against an archived `V-001` → exact BR-CON-004 on `number`; the same number in another project is ok; on update another contract's number conflicts and the contract's own number in a different case does not |
| TC-M3-007 | unit | PASS | contract.test.ts:121. type change → BR-CON-005 `field:"type"`; projectId change → `field:"projectId"`; both changed → `type` (first in order); the stored row is unchanged |
| TC-M3-008 | integration | PASS | contract.test.ts:97. Exact updated entity (number, date, value, trimmed description, new subcontractor; createdAt kept, updatedAt = new clock) returned and persisted. BR-CON-002 re-check only on change: an unchanged archived subcontractor is ok, newly selecting it → BR-GEN-006 |
| TC-M3-009 | integration | PASS | contract.test.ts:140. Exact ordered results: default sort date desc → number asc (case-insensitive) → id; filters projectId, type, subcontractorId and combinations; search on counter-party (investor and subcontractor), number, project name, description; no match → [] |
| TC-M3-010 | integration | PASS | contract.test.ts:175. Exact list item for INCOMING (`counterpartyName` = investor "Alpha Invest", projectName, invoiced/paid 0); OUTGOING → "Struct Eng"; other project → "Beta Holding"; names kept after the parents are archived. Directly inserted invoices give invoiced 1500 (cancelled excluded, archived included) and paid 1200 (PAID only, archived included), per UI-040 0.3.5 |
| TC-M3-011 | integration | PASS | contract.test.ts:213. archive sets archivedAt/updatedAt; hidden by default, shown with includeArchived; update while archived → `{BR-GEN-007, errors.archivedReadOnly}`; second archive is a no-op; restore clears it. Archiving the project leaves its contracts active (BR-GEN-005); restore under an archived project is ok (BR-GEN-008); an unknown id throws (AR-005) |
| TC-M3-012 | integration | PASS | contract.test.ts:256. Villa summary exactly `{contracted: 10_500_000, collected 0, contractedOut: 3_200_000, paidOut 0, net 0}` including archived contracts; another project's contracts are not counted (Tower = 7 / 0) |
| TC-M3-020 | e2e | PASS | tests/e2e/contracts.spec.ts:17. Default type Incoming is checked; `field-subcontractorId` absent; `field-investorName` "—" before a project is picked, then "Beta Holding"; picker = active projects sorted; the saved row shows "In", project, investor, `20.01.2026`, `€250,000.00`; date-desc/number-asc order |
| TC-M3-021 | e2e | PASS | contracts.spec.ts:56. Switching to Outgoing shows the picker and hides the investor field; saving without a subcontractor shows `error-subcontractorId` "A subcontractor is required for outgoing contracts." and the drawer stays open; picker = ["HVAC Pro","Struct Eng"]; the saved row shows "Out" |
| TC-M3-022 | e2e | PASS | contracts.spec.ts:88. "Edit Contract": every `field-type` radio and `field-projectId` disabled with the correct values; investor shown; other fields editable and the save persists. An OUTGOING contract on the archived project still shows "School Annex" (disabled) |
| TC-M3-023 | e2e | PASS | contracts.spec.ts:118. Options exactly ["All","Incoming","Outgoing"]; Outgoing → 2 rows, each with "Out" and no "In"; Incoming → 2 rows; project filter options exactly ["All projects","Office Tower","School Annex","Villa Lake"] (archived included, sorted) |
| TC-M3-024 | e2e | PASS | contracts.spec.ts:148. The Contracts tab is the default (`aria-selected`); only Villa rows (2); Project column shown; `filter-project` hidden; `filter-type` shown; cards €100,000.00 / €30,000.00. New presets the project (disabled); after saving, the cards reload (€105,000.00). The archived School Annex lists its 2 contracts and has no `btn-new` |

### Regression: M1 and M2
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M1-001…016 | unit/integration | PASS | `yarn test:unit` / `yarn test:integration` above (test files unchanged) |
| TC-M1-020…023 | e2e | PASS | tests/e2e/shell.spec.ts. The only change is the Contracts `placeholder: "Coming in M3"` → `null`. Justified by UI-001 ("placeholder applies until the named milestone implements the screen") |
| TC-M1-024 | lint | PASS | Created `src/core/__boundary_probe.ts` importing `../adapters/sqlite/SqliteContractRepository` → `yarn lint` exit 1 (`boundaries/dependencies`: core-other → adapters). Deleted the probe → `yarn lint` exit 0; confirmed it is gone from `git status` |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0: Node v22.23.3, Corepack 0.36.0, Yarn 4.18.1 = packageManager, rustc/cargo 1.99.1, targets aarch64/x86_64-apple-darwin + x86_64-pc-windows-msvc, Xcode CLT, cargo-xwin 0.23.1, makensis v3.13, clang/llvm-lib (Homebrew LLVM 23.1.5), lld-link 23.1.5, sqlite3 3.54.0 |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0: "app alive, tracker.db created, migration version 1 recorded … PASS" |
| TC-M1-031 | local | PASS | `yarn build:win-cross` exit 0: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Architecture Project Tracker_0.1.0_x64-setup.exe`, 3 810 219 bytes (> 1 MB), built today |
| TC-M1-032 | ci | PENDING-CI | Branch `mx/m3-contracts` is not pushed (`git ls-remote` returns nothing), so there is no `windows-build` run. This is not an M3 TC |
| TC-M2-001…026 | unit/integration | PASS | Test files unchanged; all pass |
| TC-M2-030…035 | e2e | PASS | Test files unchanged; all pass on the extended `basic` fixture (TC-M2-034 year options still pass with the new contract dates) |
| TC-M2-036 | e2e | PASS | tests/e2e/projects.spec.ts:97. The "Coming in M3" assertion is replaced by "the Contracts tab is selected by default and shows 'No records yet.'". Justified by UI-032 0.3.5 (Contracts tab is the default and shows the UI-040 list), UI-002a (empty-state text) and M3.md ("Office Tower has no contracts (keeps TC-M2-036 valid)"). The zero-value card assertions are unchanged |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 `// Spec:` headers | PASS | Every `.ts`/`.tsx`/`.sql` file under `src/` starts with `// Spec:` / `-- Spec:`. Only `src/ui/i18n/en.json` has no header, because JSON cannot hold comments (same as M1/M2). All 123 distinct IDs referenced in `src/` and `tests/` exist in `spec/` |
| T2 Scope of code diff | PASS | Every change maps to an M3 or 0.3.5 ID: contract domain/port/use cases/adapter (DM-040, AR-004, AR-005, BR-CON-001…005, BR-GEN-004…008); `getProject.ts` (UI-032 Contracted / Contracted-to-subcontractors cards); `Container.ts`/`composition.ts` (wiring); `App.tsx`, `navigation.ts` (UI-001 route; placeholder removed); `ListToolbar.tsx` (optional `onNew`, so "New" can be hidden for an archived project per UI-032); `StatusBadge.tsx` (In/Out badge, UI-040); `ProjectDetailScreen.tsx` (UI-032 Contracts tab + card reload); `en.json` (UI-040/041 labels and error texts); `tests/fixtures/basic.ts` (M3 fixture rows, exact values per M3.md); `tests/fixtures/services.ts` (test wiring); `shell.spec.ts` and `projects.spec.ts` (justified above). The committed diff since `specCommit` outside `spec/` is the already-validated M2 commit `cf8c6b3` |
| T3 Empty spec diff ⇒ no code diff | N/A | M3 is `pending` and the spec diff is not empty |
| T4 Architecture | PASS | `src/core` imports only relative paths inside `src/core`; `src/ui` has no `adapters` imports; `src/ui` imports `core/domain` as `import type` only (runtime constants `CONTRACT_TYPE_OPTIONS`/`CONTRACT_TYPE_DEFAULT` come from `core/usecases/contract/createContract`); adapters are wired only in `src/app/composition.ts`; `package.json`/`yarn.lock` are unchanged since `specCommit` (AR-006a); no `any`; default exports only in screen components |
| T5 i18n | PASS | No JSX text literals or quoted `label/placeholder/title/aria-label/emptyText` props in `src/ui`. The only literal is the "—" symbol in `field-investorName`, which UI-041 requires, and the same symbol was already used in M2. All new strings are in `en.json` and match the UI-041 0.3.5 texts exactly |

### Spot review of business rules
- **BR-CON-002 / BR-GEN-006** (`src/core/domain/Contract.ts` `validateContractInput`, `src/core/usecases/contract/checkContractReferences.ts`, `createContract.ts`, `updateContract.ts`): a missing subcontractor on OUTGOING → `BR-CON-002 errors.contract.subcontractorRequired` (step 1); unknown → `BR-CON-002 errors.notFound`; archived → `BR-GEN-006 errors.parentArchived`, field `subcontractorId`. On update the reference is checked only when `subcontractorId !== existing.subcontractorId`. Matches.
- **BR-CON-004** (`SqliteContractRepository.existsByNumber`): `project_id = ? AND number = ? COLLATE NOCASE AND id <> ?` over all rows including archived (ASCII NOCASE, the same as `ux_contract_project_number`). It runs last (AR-005 step 3), with `excludeId` on update. Matches.
- **BR-CON-005 + AR-005 update order** (`updateContract.ts`): unknown id throws → BR-GEN-007 → `type` then `projectId` immutability → field rules → subcontractor reference → uniqueness. `update` in the adapter does not write `type`/`project_id`. Matches.
- Also checked: create order (field rules in form order type → projectId → subcontractor → number → date → value → description, then project ref, then subcontractor ref, then uniqueness; BR-CON-001 codes are as specified). The list SQL computes `counterpartyName` with `CASE type` (investor of the project / subcontractor), and Invoiced/Paid with the UI-040 0.3.5 formulas (archived invoices included), ready for M4. Sort is `date DESC, number COLLATE NOCASE, id`, and the UI DataTable sort is stable, so it keeps the tie-break. The UI-041 type switch to INCOMING clears the subcontractor. The archive confirm names the contract number. Edit pickers add the archived referenced parent (UI-002b).

## Findings
1. Low (no impact on the verdict) UI-032: "summary cards reload after any save, archive or restore in the tab". The e2e test (TC-M3-024) checks the reload only after a save. For archive and restore, code review confirms that `ContractList.reload()` calls `onChanged`, which re-fetches the project (`src/ui/screens/Contracts/ContractList.tsx:64-67`, `ProjectDetailScreen.tsx`).
2. Info: the test-only `InMemoryContractRepository.list` ignores the `type`/`subcontractorId`/`search` filters, and its `existsByNumber` uses Unicode `toLowerCase` instead of ASCII NOCASE (`tests/unit/usecases/InMemoryContractRepositories.ts:70-80`). No unit TC relies on these. The real behaviour is covered by integration TCs on SQLite.
3. Info: `SqliteContractRepository.existsByNumber` trims `number` again, after the use case has already trimmed it (`src/adapters/sqlite/SqliteContractRepository.ts:154`). This is harmless.

## Manual steps for the user
None for M3 (no `manual` or `ci` TCs). M1's TC-M1-032 (`windows-build` CI) runs when you push the branch / open the PR. It is
PENDING-CI only because the branch is not pushed.
