# M5 validation — 2026-11-08 — spec 0.3.8 @ 4799cb2
Verdict: PASS

Round 2, independent re-validation. Implementation is uncommitted in the working tree on `mx/m5-analytics`.
Scope: M5 is `pending`, so every M5 ID/TC is in scope (AN-000 … AN-5, AN-900 … AN-905, UI-060 … UI-065, UI-033).
M1–M4 (`done`) are regression-only. Spec diff `cb38d31..HEAD -- spec/` touches only AN-5 wording and TC-M5-011, and both are in M5 scope.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, `yarn.lock` unchanged |
| G2 `yarn typecheck` | PASS | exit 0, no output |
| G3 `yarn lint` | PASS | exit 0, no output |
| G4 `yarn test:unit` | PASS | 6 files, 24 tests passed |
| G4 `yarn test:integration` | PASS | 9 files, 53 tests passed (`analytics.test.ts`: 14) |
| G4 `yarn test:e2e` | PASS | 34 passed (incl. TC-M5-020 … TC-M5-029) |
| G5 `yarn spec:trace M5` | PASS | all 25 M5 TCs traced |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M5-001 | unit | PASS | tests/unit/domain/percent.test.ts:7 — (1,3)=33.3, (2125,1000)=212.5, (x,0)=null, 45455/100000=45.5 (half-up), formatter "—" |
| TC-M5-002 | integration | PASS | tests/integration/analytics.test.ts:18 — fixture `[2027,2026,2025]` (port + use case); empty DB use case → `[2026]` / `[2031]` with clock moved (see Finding 1) |
| TC-M5-003 | integration | PASS | analytics.test.ts:31 — full row objects and footer (2, 2, 600k, 200k, 33.3) |
| TC-M5-004 | integration | PASS | analytics.test.ts:65 — 3 rows incl. Villa Lake `null` % and School Annex `projectArchived: true`; footer 3/2, 80k, 170k, 212.5 |
| TC-M5-005 | integration | PASS | analytics.test.ts:109 — 45.5 / 50.0 / 105.0; footer 3/3, 680k, 370k, 54.4 |
| TC-M5-006 | integration | PASS | analytics.test.ts:128 — no rows, zero footer, % null |
| TC-M5-007 | integration | PASS | analytics.test.ts:141 — gross 120k/120k, footer 240k, % unchanged 20.0/100.0/33.3 |
| TC-M5-008 | integration | PASS | analytics.test.ts:151 — every AN-902 column for rows, sub-rows (sorted HVAC Pro, Struct Eng) and both footers |
| TC-M5-009 | integration | PASS | analytics.test.ts:272 — 2025/2026/2027 rows + footers (budget 720k/635k/0, contracted 600k/80k/0) |
| TC-M5-010 | integration | PASS | analytics.test.ts:304 — 2025/2026 rows + footers; gross 2026 footer 204k/48k/156k/76.5 |
| TC-M5-011 | integration | PASS | analytics.test.ts:340 — snapshot of AN-1/2/4 (all years × modes), AN-3, AN-5 collected + realisation %; deleting V6/V7/V9 leaves it unchanged (matches 0.3.8 wording) |
| TC-M5-012 | integration | PASS | analytics.test.ts:371 — `listProjects({year})` ids equal AN-3 ids for 2025/2026/2027 |
| TC-M5-013 | integration | PASS | analytics.test.ts:384 — every AN-905 row value (incl. Library nulls, Villa Lake 105.0) + investor/status + full footer |
| TC-M5-014 | integration | PASS | analytics.test.ts:424 — rows Office Tower, School Annex; footer 635k / 265k / 41.7 |
| TC-M5-015 | integration | PASS | analytics.test.ts:435 — retained −90,000.00, retained % −60.0 |
| TC-M5-020 | e2e | PASS | tests/e2e/analytics.spec.ts:29 — formatted cells + footer `€600,000.00`, `33.3 %` |
| TC-M5-021 | e2e | PASS | analytics.spec.ts:45 — 2026 rows, "—" Villa Lake, Archived badge only on School Annex |
| TC-M5-022 | e2e | PASS | analytics.spec.ts:67 — footer `€240,000.00`, % unchanged, header "Contracted (net)" |
| TC-M5-023 | e2e | PASS | analytics.spec.ts:84 — expand Office Tower, HVAC Pro / Struct Eng sub-rows, footer retained `€130,000.00`, share `23.5 %` |
| TC-M5-024 | e2e | PASS | analytics.spec.ts:122 — Library budget "—", footer "Projects: 1" |
| TC-M5-025 | e2e | PASS | analytics.spec.ts:131 — footer net `€130,000.00`, margin `76.5 %` |
| TC-M5-026 | e2e | PASS | analytics.spec.ts:139 — project link on all 5 screens opens `/projects/<id>` |
| TC-M5-027 | e2e | PASS | analytics.spec.ts:157 — `All years, 2027, 2026, 2025` on UI-061/062/064; `2027, 2026, 2025` on UI-063 |
| TC-M5-028 | e2e | PASS | analytics.spec.ts:171 — footer 49.0 %, Villa Lake bar data-value/aria 87.5, Library "—", no `filter-year`/`toggle-gross`, ACTIVE filter footer |
| TC-M5-029 | e2e | PASS | analytics.spec.ts:226 — card 41.7 %, remaining `€350,000.00`; Library has no card |
| M1–M4 TCs | regression | PASS | all in the green G4 run. Changed regression tests reviewed: TC-M2-036 (`.first()` because the UI-033 card adds a second "Collected" label), TC-M4-027 (card locator skips `card-realisation`), shell NAV placeholders → null (M5 screens implemented). None of them asserts less than before. |

No local/lint/ci/manual TCs in M5.

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every `.ts/.tsx/.sql` under `src/` starts with `// Spec:` (or `-- Spec:`) and every ID it lists exists in `spec/` |
| T2 Diff ↔ scope | PASS | no committed code change since `cb38d31`. Working-tree changes are new analytics adapter/use cases/domain types/screens/components, wiring in Container/composition/App/navigation, `analytics` E2E seed, UI-033 card in ProjectDetail, i18n `analytics.*` keys, plus the M5 tests and fixture. All of them map to AN-*/UI-06x/UI-033. |
| T3 Empty spec diff ⇒ no code | N/A | M5 is `pending` |
| T4 Architecture | PASS | `src/core` imports all resolve inside `src/core`; no `adapters` import in `src/ui`; `package.json` deps unchanged and within AR-006a |
| T5 i18n | PASS | no alphabetic JSX text literals in the new screens/components (grep); labels come from `analytics.*`, `common.*`, `enum.*`. Only symbols in JSX: "—", "↳", "▸/▾". |

Spot review (AN rules vs. code):
- AN-1 / AN-000c (`getContractedVsCollected.ts`, `SqliteAnalyticsQuery.ts`): the row condition is "INCOMING contract dated in Y (any value) or collected > 0". Percentages are always computed from a separate NET query, and the footer % comes from footer totals. Matches.
- AN-2 (`getSubcontractorPayments.ts`): paid%, share%, retained and retained% use net values. Sub-row share = sub paid ÷ project collected. Sub-rows are sorted by subcontractor name in SQL. Footer is built from summed totals. Matches.
- AN-5 (`getBudgetRealisation.ts`): "% of budget" is null for a null or 0 budget; "% of contracted" is null only when Contracted = 0 (0.3.8). Footer budget, remaining and "% of budget" use budgeted projects only, and "% of contracted" uses all rows. Invoiced = ISSUED + PAID INCOMING. Matches.
- Gross amount SQL `(value*vat_rate+5000)/10000` = round_half_up for non-negative integers (AN-000). Correct.

## Findings
1. Low AN-000h / TC-M5-002 — `AnalyticsQuery.availableYears()` (and `ProjectRepository.availableYears()`, M2) returns `[]` on an empty DB. The `[current year]` fallback is in the use case `getAvailableYears`, which uses `Clock`, and the test asserts both behaviours. The UI only uses the use case, so the observable behaviour is correct. A literal reading of AN-000h ("availableYears() … if empty → [current year]") would put the fallback in the port. Suggested spec clarification (R6), no code change: in AR-004 add "the port returns `[]` when empty; the `getAvailableYears` use case applies the AN-000h current-year fallback via `Clock`."
2. Info M5 deliverables — `getAvailableYears` lives in `src/core/usecases/project/` (from M2) and was reused. There is no copy under `usecases/analytics/`. AR-004 says AnalyticsQuery reuses the project implementation, so this is acceptable.
3. Info UI-060 — `useYearSelection` picks the default year with `new Date().getFullYear()` in the UI instead of the `Clock` port. This is allowed (the UI is not core), but it is not deterministic under a test clock. No TC covers it.

## Manual steps for the user
None for M5 (no manual/ci TCs). Optional demo check: in the Tauri app with real data, open each Analytics screen and confirm the default year is the current calendar year when it has data.
