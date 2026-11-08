# M6 validation — 2026-11-08 — spec 0.4.0 @ 7178af3
Verdict: PASS-WITH-PENDING (the only open item is TC-M6-013, which is MANUAL; every gate, every automated TC incl. CI TC-M1-032, and T1–T5 passed)

Round 3 (final). Code under test: 798f90d on `mx/m6-serbian-latin` (working tree clean). Lock: specCommit d77ad77
(M1–M5 done). In-scope: M6 IDs/TCs plus TC-M1-010, 011, 014, 030, 032 (changed in `git diff d77ad77 HEAD -- spec/`).
All other M1–M5 TCs are regression-only.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, lockfile unchanged |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 9 files, 30 tests |
| G4 `yarn test:integration` | PASS | 9 files, 56 tests |
| G4 `yarn test:e2e` | PASS | 38 passed (chromium) |
| G5 `yarn spec:trace M1…M6` | PASS | each exits 0, "All automated test cases of Mx are traced." |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M6-001 | unit | PASS | tests/unit/i18n/translations.test.ts:15 — sorted deep leaf-key lists equal; no blank values in either file |
| TC-M6-002 | unit | PASS | tests/unit/format/localeFormat.test.ts:9 — exact `1.234,56 €` and `€1,234.56` |
| TC-M6-003 | unit | PASS | tests/unit/format/localeFormat.test.ts:14 — all five exact values incl. `—` |
| TC-M6-004 | unit | PASS | tests/unit/format/localeFormat.test.ts:22 — 950/950, `20,125` and `9,5,0` → BR-GEN-003 `errors.format` |
| TC-M6-005 | unit | PASS | tests/unit/usecases/settings.test.ts:7 — BR-GEN-003, field `language`, repo unchanged |
| TC-M6-006 | integration | PASS | tests/integration/migrations.test.ts:103 (0002 SQL == DS-006 text) and :115 (only-0001 DB → applies [2], language `en`, versions 1,2, rerun [], CHECK rejects `de`) |
| TC-M6-007 | integration | PASS | tests/integration/settings.test.ts:48 — persisted (fresh repo + raw SQL), getSettings returns `sr-Latn` |
| TC-M6-008 | e2e | PASS | tests/e2e/language.spec.ts:39 + helpers.ts `setLanguage` (toast "Sačuvano"/"Saved"), sidebar labels, client-side navigation, back to English |
| TC-M6-009 | e2e | PASS | tests/e2e/language.spec.ts:63 — footer `600.000,00 €` (NBSP normalised) and `33,3 %` |
| TC-M6-010 | e2e | PASS | tests/e2e/language.spec.ts:78 — all 11 UI-001 screens, key regex and English sidebar labels (incl. "Analytics") absent |
| TC-M6-011 | e2e | PASS | tests/e2e/language.spec.ts:95 — calendar header `mart 2026`; typed `05.03.2026` saved, row shows `05.03.2026` (display of stored `2026-03-05` per UI-002) |
| TC-M6-012 | unit | PASS | tests/unit/format/localeFormat.test.ts:32 — exact order Cvijić, Čačak, Ćuprija, Dragan, Đakovica |
| TC-M6-013 | manual | MANUAL | see Manual steps |
| TC-M1-010 | integration | PASS | tests/integration/migrations.test.ts:31 — applied [1,2], all DS-003 tables/indexes, two schema_migrations rows; :44 0001 == DS-003 |
| TC-M1-011 | integration | PASS | tests/integration/migrations.test.ts:55 — second run [], versions still 1,2, one settings row |
| TC-M1-014 | integration | PASS | tests/integration/settings.test.ts:21 — default EUR/2000/en; RSD/1000/en persisted |
| TC-M1-024 | lint | PASS | probe `src/core/__boundary_probe.ts` importing `../adapters/sqlite/bundledMigrations` → lint exit 1 (`boundaries/dependencies`); probe deleted → lint exit 0 |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0: Node v22.23.3, Yarn 4.18.1, rustc 1.99.1, targets aarch64/x86_64-apple-darwin + x86_64-pc-windows-msvc, cargo-xwin 0.23.1, makensis v3.13, clang/llvm-lib (Homebrew 23.1.5), lld-link 23.1.5, sqlite3 3.54.0 |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0 — "app alive, tracker.db created, migration versions 1, 2 recorded", "[smoke:mac] PASS" (script compares `SELECT version … ORDER BY version` to `1\n2`) |
| TC-M1-031 | local | PASS | `yarn build:win-cross` exit 0 — `Architecture Project Tracker_0.1.0_x64-setup.exe` 3,823,350 bytes (> 1 MB), built during this run |
| TC-M1-032 | ci | PASS | `gh run view 42465971377` (windows-build, PR #7, headSha 798f90d = HEAD): conclusion success; step "TC-M1-032 Windows installer smoke test" success; workflow asserts `SELECT version FROM schema_migrations ORDER BY version` = `1,2` |
| Other TCs of M1–M5 (regression-only) | unit/integration/e2e | PASS | present in green G4 run, G5 passes for M1–M5; only changed test files since d77ad77 are migrations.test.ts, settings.test.ts (read, above) and unit/usecases/invoice.test.ts (fixture adds `language: "en"` only) |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every `src/` file has `// Spec:`/`-- Spec:` with existing IDs; `en.json`/`sr-Latn.json` cannot carry comments (JSON), same as accepted `en.json` since M1 |
| T2 Diff maps to scope | PASS | all code changes d77ad77..HEAD map to M6 IDs: DM-060 (Settings.language, updateSettings, sqlite mapping), DS-006 (0002 migration, bundledMigrations/runMigrations headers), AR-010/UI-090 (main.tsx applyLanguage, Root DatesProvider, i18n index), UI-002/UI-050 (locale.ts, money/percent/vatPercent, sorting in DataTable/forms/lists), UI-080 (SettingsScreen), UI-091 (sr-Latn.json), AR-012 (smoke-mac.mjs, windows-build.yml `1,2`). 5588c59 only touched lock + report. No unexplained change |
| T3 Empty diff ⇒ no code | N/A | spec diff non-empty; M6 pending |
| T4 Architecture | PASS | no non-relative or escaping imports in `src/core`; no `adapters` imports in `src/ui`; package.json/yarn.lock unchanged; `dayjs/locale/sr` is part of AR-006 `dayjs` 1 |
| T5 i18n | PASS | grep for JSX text literals / literal label|placeholder|title|message props in `src/ui` finds none (only TS generics); new Settings select uses `settings.language` / `settings.languageOption.*` |

Spot review (3 rules):
- DM-060 / BR-GEN-003 `language`: `src/core/usecases/settings/updateSettings.ts` trims, checks `isLanguage` (`en`, `sr-Latn`), returns `formatError("language")` before `settingsRepo.update` — matches.
- UI-002 locale + sorting: `src/ui/format/locale.ts` maps `en`→`en-GB`, `sr-Latn`→`sr-Latn-RS`; `compareText` uses `localeCompare(locale, { sensitivity: "base", numeric: true })`; used by DataTable, pickers and list helpers — matches.
- UI-080/UI-090 immediate apply: SettingsScreen calls `applyLanguage` then `setSettings(result.value)` (context drives formatting) and shows the toast via `i18n.t` in the new language; `Root.tsx` `DatesProvider` locale `sr` for `sr-Latn`, else `en`; `main.tsx` applies stored language before render — matches.

## Findings
1. Info — UI-090 — `en.json` / `sr-Latn.json` have no `Spec:` header because JSON has no comments (accepted convention since M1) — src/ui/i18n/
2. Info — TC-M6-011 — the e2e test checks the stored date through the list display `05.03.2026` (UI-002 formatting of `2026-03-05`) instead of reading the raw value; I accept this as equivalent — tests/e2e/language.spec.ts:95

No failures.

## Manual steps for the user
1. TC-M6-013: `yarn dev` (or the built app), Settings → Language "Srpski (latinica)" → Save. Visit every sidebar
   screen, open each create/edit drawer, the project detail tabs, archive/restore dialogs and error states; check
   wording against UI-091 (e.g. "Novi projekat", "Nova faktura", "Izmena: …", statuses Nacrt/Izdata/Plaćena/Stornirana,
   PDV/PIB, Ul/Iz badges). Switch back to English and confirm English is unchanged.
