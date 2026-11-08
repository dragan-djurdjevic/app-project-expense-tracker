# M6 validation — 2026-11-08 — spec 0.4.0 @ 7178af3
Verdict: FAIL

Round 2. Branch `mx/m6-serbian-latin`, implementation uncommitted in the working tree. `spec-lock.json` specCommit
`d77ad77` (M1–M5 done). In scope: M6 (all IDs/TCs) plus TC-M1-010, 011, 014, 030, 032 (changed in
`git diff d77ad77 HEAD -- spec/`). M1–M5 regression-only.

The only failing item is TC-M1-031 (`yarn build:win-cross`). It fails because a network download returns HTTP 504
(`nsis_tauri_utils.dll` from github.com). Nothing in the code is wrong. AR-012 says this must be reported as FAIL
and never skipped. Every other gate and automated TC passes.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, lockfile unchanged |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 9 files, 30 tests passed |
| G4 `yarn test:integration` | PASS | 9 files, 56 tests passed |
| G4 `yarn test:e2e` | PASS | 38 passed, 0 failed/flaky/skipped |
| G5 `yarn spec:trace M1…M6` | PASS | all six milestones traced, exit 0 |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M6-001 | unit | PASS | tests/unit/i18n/translations.test.ts:15 — sorted deep leaf keys are equal; empty values are checked in both files |
| TC-M6-002 | unit | PASS | tests/unit/format/localeFormat.test.ts:9 — exact `1.234,56 €` and `€1,234.56` |
| TC-M6-003 | unit | PASS | tests/unit/format/localeFormat.test.ts:14 — all 5 exact values |
| TC-M6-004 | unit | PASS | tests/unit/format/localeFormat.test.ts:22 — 950/950, BR-GEN-003 errors for `20,125` and `9,5,0` |
| TC-M6-005 | unit | PASS | tests/unit/usecases/settings.test.ts:7 — exact error `{BR-GEN-003, errors.format, field language}`; repo unchanged |
| TC-M6-006 | integration | PASS | tests/integration/migrations.test.ts:103 (file equals DS-006 SQL), :114 (only 0001 → applies [2], language `en`, existing values kept, versions 1,2, rerun [] , CHECK rejects `de`) |
| TC-M6-007 | integration | PASS | tests/integration/settings.test.ts:48 — result, fresh repo, getSettings and raw row all `sr-Latn` |
| TC-M6-008 | e2e | PASS | tests/e2e/language.spec.ts:39 + helpers.ts:70 (toast "Sačuvano"/"Saved"); sidebar Projekti/Podešavanja; client-side navigation keeps Serbian; English restores |
| TC-M6-009 | e2e | PASS | tests/e2e/language.spec.ts:63 — footer exactly `600.000,00 €`, `200.000,00 €`, `33,3 %` (NBSP normalised) |
| TC-M6-010 | e2e | PASS | tests/e2e/language.spec.ts:78 — all 11 UI-001 items; key regex and English sidebar labels (+"Analytics") are absent |
| TC-M6-011 | e2e | PASS | tests/e2e/language.spec.ts:95 — calendar header `mart 2026`; the saved row shows `05.03.2026` (rendered from the stored ISO date) |
| TC-M6-012 | unit | PASS | tests/unit/format/localeFormat.test.ts:32 — exact order |
| TC-M6-013 | manual | MANUAL | see below |
| TC-M1-010 | integration | PASS | tests/integration/migrations.test.ts:31 — applied [1,2], tables/indexes, 2 rows in schema_migrations; :44 0001 equals DS-003 |
| TC-M1-011 | integration | PASS | tests/integration/migrations.test.ts:55 — 2nd run [], versions 1,2, 1 settings row |
| TC-M1-014 | integration | PASS | tests/integration/settings.test.ts:21 — default EUR/2000/en; RSD/1000/en persisted (fresh repo) |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0: "app alive, tracker.db created, migration versions 1, 2 recorded", PASS. Script expects exactly `1\n2` with `ORDER BY version` |
| TC-M1-032 | ci | PENDING-CI | branch not pushed, so there is no `windows-build` run. Workflow diff reviewed: the query uses `ORDER BY version` and expects `1,2` |
| TC-M1-024 | lint | PASS | probe `src/core/__boundary_probe.ts` importing `../adapters/sqlite/SqlJsDriver` → lint exit 1 (`boundaries/dependencies`); probe deleted → lint exit 0 |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0: Node v22.23.3, Yarn 4.18.1 = packageManager, rustc 1.99.1, 3 targets, cargo-xwin 0.23.1, makensis v3.13, clang/llvm-lib 23.1.5, lld-link 23.1.5, sqlite3 3.54.0 |
| TC-M1-031 | local | FAIL | `yarn build:win-cross` exit 1 twice (10:0x): `Downloading https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll` → `failed to bundle project: http status: 504`. A direct `curl` of the URL also returns 504. The `*-setup.exe` on disk (3.8 MB, 09:29) is stale and was not counted as evidence |
| Other M1–M5 TCs (unit/integration/e2e) | — | PASS | regression-only: all are in the green G4 run and G5 passes. Changed test files since specCommit (`tests/unit/usecases/invoice.test.ts`, `tests/e2e/helpers.ts`, `tests/integration/settings.test.ts` TC-M1-015) were reviewed: they only add `language`, and the assertions were not weakened |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every `.ts/.tsx/.sql` under `src/` starts with `// Spec:` / `-- Spec:`; all listed IDs exist in spec. JSON files (`en.json`, `sr-Latn.json`) cannot carry comments |
| T2 Changes map to scope | PASS | all working-tree changes are in DM-060, DS-002/006, AR-010, AR-012, UI-002, UI-050, UI-080, UI-090, UI-091 (formatter locale arg, `compareText` for list/picker sorting, DatesProvider, language select, migration 0002, smoke/CI expecting 1,2). The committed non-spec diff since d77ad77 (`spec-lock.json`, `validation/sync-0.3.9-report.md`) is the 0.3.9 spec-sync commit |
| T3 Empty-diff rule | N/A | spec diff is not empty |
| T4 Architecture | PASS | `src/core` imports only relative core paths; `src/ui` does not import `src/adapters`; ui imports from core/domain are `import type`; `package.json`/`yarn.lock` unchanged; deps match AR-006a (`dayjs/locale/sr` is part of `dayjs`) |
| T5 i18n | PASS | grep finds no JSX text literals or literal `label/placeholder/title` props in `src/ui`; option labels come from `settings.languageOption.*`. Values identical in both languages are only the product name, `DD.MM.YYYY`, "Status", an interpolation template and the language option labels, which matches the spec |

## Findings
1. High (environment) TC-M1-031 / AR-012 — `yarn build:win-cross` fails while downloading `nsis_tauri_utils.dll` from GitHub (HTTP 504, reproduced with curl). This is a network problem, not a code defect, and no code change is needed. Rerun `yarn build:win-cross` when GitHub downloads work again, then re-validate.
2. Info DM-060 — `updateSettings` trims `language` before validating (`" en "` is accepted). This matches the existing `currency` handling, the UI cannot produce such input, and the spec is silent on trimming. No action needed.
3. Info UI-002 — `localizeDecimal` replaces only the first `.`. This is correct, because percent and VAT texts are built without grouping separators.

Spot review of 3 rules (all match the spec):
- DM-060 / BR-GEN-003 language: `src/core/usecases/settings/updateSettings.ts` validates in form-field order currency → VAT → language and returns `formatError("language")` before persisting.
- UI-002 formatting/sorting: `src/ui/format/locale.ts` (`en-GB` / `sr-Latn-RS`; `localeCompare(locale, {sensitivity:"base", numeric:true})`), `money.ts` with `Intl.NumberFormat(locale)`, and `percent.ts`/`vatPercent.ts` with a decimal comma for sr-Latn. Every call site in `src/ui` passes `settings.language`.
- UI-080/UI-090 apply immediately: `SettingsScreen.tsx` calls `applyLanguage` before `setSettings` and shows the toast via `i18n.t` in the new language. `main.tsx` applies the stored language before `root.render`. `Root.tsx` sets the `DatesProvider` locale to `sr` or `en` from the active i18n language.

## Manual steps for the user
- TC-M6-013: run `yarn dev:web` (or the app), go to Settings, choose "Srpski (latinica)" and save. Then open every screen (projects, project detail, contracts, invoices, investors, subcontractors, the 5 analytics views, settings) and all drawers and dialogs. Check the wording against the UI-091 table: drawer titles ("Novi …", "Izmena: …"), status badges, Ul/Iz badges, PIB/PDV, empty-state texts and the date picker months.
- TC-M1-031: when GitHub is reachable again, run `PATH="$HOME/.cargo/bin:/opt/homebrew/opt/rustup/bin:/opt/homebrew/opt/llvm/bin:$PATH" yarn build:win-cross`. Confirm that a fresh `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.exe` > 1 MB exists.
- TC-M1-032: after you allow a push, check the `windows-build` workflow run for `mx/m6-serbian-latin`.
