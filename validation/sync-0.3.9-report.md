# sync 0.3.9 validation — 2026-11-08 — spec 0.3.9 @ d77ad77
Verdict: PASS-WITH-PENDING

Scope: `git diff 4799cb2 HEAD -- spec/` changes only the AR-004 `AnalyticsQuery` row (`availableYears()` returns `[]`
when empty; the `getAvailableYears` use case applies the AN-000h current-year fallback). PATCH change, no TCs added or
changed. In-scope: AR-004 (availableYears row). Regression-only: M1–M5 (all `done`).

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, working tree clean afterwards |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 6 files, 24 tests passed |
| G4 `yarn test:integration` | PASS | 9 files, 53 tests passed |
| G4 `yarn test:e2e` | PASS | 34 passed |
| G5 `yarn spec:trace M1..M5` | PASS | all five exit 0, "All automated test cases of Mx are traced." |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| AR-004 (in-scope, availableYears row) | integration | PASS | tests/integration/analytics.test.ts:18 (TC-M5-002) asserts `analyticsQuery.availableYears()` = `[2027, 2026, 2025]` on fixture and `[]` on empty DB; `getAvailableYears()` = `[2026]` on empty DB and `[2031]` after clock set to 2031 |
| TC-M1-024 | lint | PASS | probe `src/core/__boundary_probe.ts` importing `../adapters/sqlite/SqliteAnalyticsQuery` → lint exit 1 (`boundaries/dependencies` error); probe deleted → lint exit 0 |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0: Node v22.23.3, Yarn 4.18.1, rustc/cargo 1.99.1, targets aarch64/x86_64-apple-darwin + x86_64-pc-windows-msvc, cargo-xwin 0.23.1, nsis v3.13, clang/llvm-lib/lld-link 23.1.5, sqlite3 3.54.0 |
| TC-M1-030 | local | PASS | `yarn smoke:mac`: "app alive, tracker.db created, migration version 1 recorded", "[smoke:mac] PASS" |
| TC-M1-031 | local | PASS | `yarn build:win-cross`: `Architecture Project Tracker_0.1.0_x64-setup.exe` 3,819,040 bytes (> 1 MB) |
| TC-M1-032 | ci | PENDING-CI | branch `mx/m5-analytics` not pushed; no `windows-build` run for this branch |
| TC-M4-030 | manual | MANUAL | see below |
| All other M1–M5 automated TCs | unit/integration/e2e | PASS (regression) | green G4 run + G5; no test file changed since `specCommit` other than through the committed M5 milestone (c0bd2d8), none since |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every tracked `src/` code file has a `// Spec:` header; all listed IDs exist in spec (`en.json` excepted, JSON) |
| T2 Code diff maps to scope | PASS | diff since `specCommit` 4799cb2 = M5 implementation committed in c0bd2d8 `feat(M5): analytics views (spec 0.3.8)` (validated against 4799cb2); c0bd2d8..HEAD is spec-only (d77ad77); no uncommitted/untracked changes |
| T3 Empty spec diff ⇒ no code diff | N/A | spec diff non-empty; it is a clarification that existing code already satisfies, so no code change was required |
| T4 Architecture | PASS | no imports from outside `src/core` in `src/core`; no `adapters` imports in `src/ui`; `package.json`/`yarn.lock` unchanged since specCommit, deps match AR-006a |
| T5 i18n | PASS | grep for literal JSX text and literal `label/placeholder/title/aria-label` in `src/ui/**/*.tsx` → only TS generic false positives |

## AR-004 review (in-scope)
- Port `src/core/ports/AnalyticsQuery.ts:19` `availableYears(): Promise<number[]>`.
- Adapter `src/adapters/sqlite/SqliteAnalyticsQuery.ts:236` delegates to `SqliteProjectRepository.availableYears()`
  (`src/adapters/sqlite/SqliteProjectRepository.ts:124`), a plain `SELECT DISTINCT … ORDER BY year DESC` → `[]` when empty; no fallback in the port. Matches.
- Use case `src/core/usecases/project/getAvailableYears.ts:16-19` returns `years` if non-empty, else `[clock.now().getFullYear()]`. Matches AN-000h.
- UI (`src/ui/components/YearFilter.tsx:21`, `ProjectsScreen.tsx:44`) uses only `useCases.getAvailableYears()`, never the port directly. Matches.
- No business rules are in scope for this sync, so the BR spot review is replaced by the AR-004 review above.

## Findings
1. Info AR-004 — `getAvailableYears.ts` header lists `AR-005, AN-000, AN-3, UI-030` but not AR-004, which now names this use case. Traceability still holds through the port/adapter headers. No action needed. — src/core/usecases/project/getAvailableYears.ts:1

## Manual steps for the user
- TC-M1-032: after you approve a push, push `mx/m5-analytics` and confirm that the `windows-build` workflow passes (`gh run list --workflow windows-build --branch mx/m5-analytics`).
- TC-M4-030: in Tauri mode on Windows, attach a PDF to an invoice and click the file link. It should open in the default PDF viewer, and the file should be under `%APPDATA%\com.archtracker.app\documents\<invoiceId>\`.
