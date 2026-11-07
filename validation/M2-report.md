# M2 validation — 2026-11-08 — spec 0.3.4 @ 8b0fb0b
Verdict: PASS

Branch `mx/m2-crud`. The implementation is uncommitted in the working tree (12 modified, 55 untracked files under `src/` and `tests/`).
`spec/` has no uncommitted changes. `spec-lock.json` has `specCommit = d28ee49` (0.3.3), M1 `done`, M2 `pending`. The scope is
the full M2 spec plus the 0.3.4 spec diff (`git diff d28ee49 HEAD -- spec/`): AR-004, AR-005, BR-GEN-004, UI-002a, UI-002b,
UI-010 and UI-032. M2 has no `local`, `ci` or `manual` TCs. Environment: Node v22.23.3, Yarn 4.18.1.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0; `yarn.lock` byte-identical before and after (`cmp`) |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0, 0 problems |
| G4 `yarn test:unit` | PASS | 3 files, 13 tests passed (9 M1 + 4 M2) |
| G4 `yarn test:integration` | PASS | 6 files, 22 tests passed (8 M1 + 14 M2) |
| G4 `yarn test:e2e` | PASS | e2e build + Playwright Chromium: 11 tests passed (4 M1 + 7 M2) |
| G5 `yarn spec:trace M2` | PASS | exit 0, "All automated test cases of M2 are traced." (25/25). `spec:trace M1` also passes. |
| Prettier (read-only `--check src tests`) | PASS | "All matched files use Prettier code style!" |

## Test cases
| TC | Level | Result | Evidence (test file:line or command) |
|---|---|---|---|
| TC-M2-001 | unit | PASS | tests/unit/usecases/investor.test.ts:24. Exact entity: id from IdGenerator, createdAt = updatedAt = Clock time, archivedAt null, trim, VAT upper-cased, empty phone → null; checks the repo row too |
| TC-M2-002 | unit | PASS | investor.test.ts:50. Exact `{BR-GEN-002, errors.required, field:"name"}` and `field:"vatNumber"`; nothing is persisted |
| TC-M2-003 | unit | PASS | investor.test.ts:64. `a@b` returns exact `{BR-GEN-003, errors.format, field:"email"}` |
| TC-M2-004 | integration | PASS | tests/integration/investor.test.ts:8. BR-INV-001 for the same VAT, for `ab1` vs `AB1`, against an archived investor, and on update; DB keeps 2 rows |
| TC-M2-005 | integration | PASS | investor.test.ts:26. Exact updated entity: new updatedAt, original createdAt; same VAT (other case) is not a false duplicate |
| TC-M2-006 | integration | PASS | investor.test.ts:54. archivedAt/updatedAt = clock; the default list excludes the row; `includeArchived` includes it; a second archive is a no-op (archivedAt unchanged) |
| TC-M2-007 | integration | PASS | investor.test.ts:74. archivedAt null, updatedAt = clock, row back in the default list |
| TC-M2-008 | unit | PASS | investor.test.ts (unit):74. Exact `{BR-GEN-007, errors.archivedReadOnly}`; the stored row is unchanged |
| TC-M2-009 | integration | PASS | investor.test.ts:88. "alp" matches by name, by VAT (`ZALP-01`) and by contact person; case-insensitive; exact name-sorted result |
| TC-M2-010 | integration | PASS | tests/integration/subcontractor.test.ts:6. Exact entity at create, update (industry changes), archive and restore; search on industry; BR-GEN-007 while archived |
| TC-M2-011 | integration | PASS | subcontractor.test.ts:70. A VAT that is already an investor's is accepted; a duplicate subcontractor VAT returns exact `{BR-SUB-001, errors.vat.duplicate, vatNumber}`; count 1 |
| TC-M2-020 | integration | PASS | tests/integration/project.test.ts:14. Exact entity, status PLANNED, budget/deadline null; with budget it is stored |
| TC-M2-021 | integration | PASS | project.test.ts:47. Archived investor gives `{BR-GEN-006, errors.parentArchived, investorId}`; unknown id gives `{BR-PRJ-001, errors.notFound, investorId}`; 0 rows |
| TC-M2-022 | integration | PASS | project.test.ts:62. The update succeeds with the archived investor unchanged (exact value), the list shows the investor name, and moving to the archived investor is rejected |
| TC-M2-023 | integration | PASS | project.test.ts:98. All 5×5 status transitions succeed and are persisted |
| TC-M2-024 | integration | PASS | project.test.ts:112. Status multi-select, investorId, year 2024–2027 per AN-3 (deadline, or a contract inserted via SQL including an archived OUTGOING one), combined filters, search on investor name, archived excluded under the year filter, `availableYears` = [2027, 2026, 2025] |
| TC-M2-025 | integration | PASS | project.test.ts:159. Projects stay active after their investor is archived; BR-GEN-008 restore check included |
| TC-M2-026 | integration | PASS | investor.test.ts:108. Count = non-archived projects of any status (CANCELLED counted, archived not), as in UI-010 0.3.4 |
| TC-M2-030 | e2e | PASS | tests/e2e/investors.spec.ts:5. Create shows the row and the "Saved" toast; edit name updates the row; archive through `confirm-archive` hides the row; the toggle shows it with the "Archived" badge; Restore makes it active |
| TC-M2-031 | e2e | PASS | investors.spec.ts:55. `error-name` "This field is required."; `error-vatNumber` "This VAT number is already in use."; the drawer stays open |
| TC-M2-032 | e2e | PASS | tests/e2e/subcontractors.spec.ts:5. Create; search by industry ("hvac", "FACAD"); "No records match your search."; archive |
| TC-M2-033 | e2e | PASS | tests/e2e/projects.spec.ts:10. The picker offers only the active investor (`toHaveText(["Alpha Invest"])`); status default Planned; "Planned" shown in the row; `01.05.2027`; `€1,234.56`; `€600,000.00` |
| TC-M2-034 | e2e | PASS | projects.spec.ts:42. Status and year filters narrow the list as expected on seed `basic`; year options exactly ["All years", "2026", "2025"] |
| TC-M2-035 | e2e | PASS | projects.spec.ts:73. Archived row opens the drawer titled "Project" (UI-002b 0.3.4); fields are disabled; Restore is visible; no save/cancel buttons; after restore it opens "Edit Project" |
| TC-M2-036 | e2e | PASS | projects.spec.ts:97. `screen-title` = project name; investor, status, `31.12.2026`, `€600,000.00`; all 5 cards show `€0.00`; tabs show "Coming in M3" / "Coming in M4" |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 `// Spec:` headers | PASS | Every `.ts`/`.tsx`/`.sql` under `src/` has a header (only `src/ui/i18n/en.json` has none, because JSON cannot hold comments; same as M1). All 55 distinct IDs used in `src/` and `tests/` exist in `spec/`. |
| T2 Scope of code diff | PASS | Every changed or new file maps to M2 scope IDs or to 0.3.4 diff IDs (AR-004 `availableYears`, AR-005 null/throw/first-error). Explained edits outside M2-only files: `tests/e2e/shell.spec.ts` (TC-M1-020/021 placeholder expectation is now null for screens implemented in M2, per UI-001 "placeholder applies until the named milestone"); `src/ui/navigation.ts` (same reason); `src/ui/format/date.ts` (DD.MM.YYYY parse helpers for the UI-031 deadline input); `src/app/testHooks.ts` + `src/app/e2eFixtures.ts` (seed `basic`, an M2 deliverable). `.github/workflows/windows-build.yml` and `spec-lock.json` differ from `specCommit` only through the already committed `chore(spec-sync): apply spec 0.3.3`. |
| T3 Empty spec diff ⇒ no code diff | N/A | M2 is `pending`, and the spec diff is not empty |
| T4 Architecture | PASS | `src/core` imports only relative paths inside `src/core`; `src/ui` has no `adapters` imports; `src/ui` imports `core/domain` with `import type` only (runtime constants come from `core/usecases/project/createProject`); adapters are wired only in `src/app/composition.ts` (plus `testHooks.ts`, the e2e-only hook from M1); `package.json` is unchanged since `specCommit` and matches AR-006a; no `any`; default exports only in screen components |
| T5 i18n | PASS | No JSX text literals in `src/ui` (grep for `>text<` and quoted `label/placeholder/title/aria-label/emptyText` props finds nothing). Only symbols `⋯`, `▲/▼` and `—` appear. All new strings are in `en.json` under `common.*`, `entity.*`, `enum.projectStatus.*`, `errors.*` |

### Spot review of business rules
- **BR-GEN-006 / BR-PRJ-001** (`src/core/usecases/project/updateProject.ts`, `checkInvestorReference.ts`): the investor reference is checked on create, and on update only when `investorId` changes. Unknown id → `BR-PRJ-001 errors.notFound`, archived → `BR-GEN-006 errors.parentArchived`. Matches the rule ("existing references to a parent archived later stay valid").
- **BR-GEN-004 + AR-005 0.3.4** (`archive*/restore*` use cases): unknown id throws; archive on an archived record and restore on an active record are no-op `ok`. Matches.
- **BR-INV-001 / BR-SUB-001** (`Sqlite*Repository.existsByVat`, `create/updateInvestor`): `UPPER(vat_number) = UPPER(?)` over all rows including archived, with `excludeId` on update. Each repository checks only its own table, so an investor and a subcontractor can share a VAT number (DM-020). Matches.
- Also checked: the validation order matches the form order (UI-011 / UI-021 / UI-031) and returns the first error (AR-005); the AN-3 year filter uses the DS-005 expression; `availableYears` follows AN-000h, with an empty result → [current year] in `getAvailableYears`; the empty-state text depends only on the search text (UI-002a 0.3.4); the edit picker adds the currently referenced archived investor (UI-002b 0.3.4).

## Findings
1. Low (no impact on the verdict) UI-031 / R3: `src/ui/format/date.ts` now has the UI-031 date-input helpers `parseDisplayDate`, `dateToIso` and `isoToDate`, but its header still lists only `// Spec: UI-002`. Suggest adding UI-031 to the header.
2. Low (no impact on the verdict) TC-M2-033: the "status badge shown" check finds the text "Planned" in the row (`projects.spec.ts:36`). It does not check that the text is a badge, such as the Mantine Badge class or the colour. Code review confirms the column uses `ProjectStatusBadge` (`src/ui/components/StatusBadge.tsx`).
3. Info UI-002b: in the edit form, an archived investor kept in the picker is appended after the active, name-sorted options (`src/ui/screens/Projects/ProjectForm.tsx`). The spec does not say where that entry goes, so this is not a defect.
4. Info AR-002: `src/app/e2eFixtures.ts` imports `tests/fixtures/basic.ts`. It loads only through a dynamic `import()` inside the `MODE === "e2e"` guard in `composition.ts` (AR-009), and lint (boundaries) passes.

## Manual steps for the user
None for M2 (no `manual`, `local` or `ci` TCs). After commit/push, the existing M1 `windows-build` CI (TC-M1-032) will run as usual.
