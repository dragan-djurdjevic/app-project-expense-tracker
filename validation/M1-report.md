# M1 validation — 2026-11-07 — spec 0.3.2 @ d2e4a9e
Verdict: PASS-WITH-PENDING (only TC-M1-032 (ci) open; every gate and every local/automated TC passed)

Branch `mx/m1-initial-setup`, implementation uncommitted in the working tree (99 untracked files + `README.md` modified).
`spec-lock.json`: `specCommit = null`, M1 `pending`, so the scope is the full M1 spec. `spec/` has no uncommitted changes.
Environment: Node v22.23.3, Yarn 4.18.1 (Corepack), rustc 1.99.1, `~/.zshrc` sourced for rustup / `~/.cargo/bin` / llvm PATH.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0; `yarn.lock` byte-identical before/after (`cmp`) |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0, 0 problems |
| G4 `yarn test:unit` | PASS | 2 files, 9 tests passed |
| G4 `yarn test:integration` | PASS | 3 files, 8 tests passed |
| G4 `yarn test:e2e` | PASS | e2e build + Playwright Chromium: 4 tests passed |
| G5 `yarn spec:trace M1` | PASS | exit 0, "All automated test cases of M1 are traced." (020–023 e2e, 001–016 unit/integration) |
| `yarn verify` (acceptance) | PASS | exit 0: test (9 + 8 + 4) + smoke:mac PASS + build:win-cross produces the installer. The lld-link output includes harmless `failed to load reference ...libcmt.amd64.pdb` debug-info warnings. |
| Prettier (R4, read-only `--check`) | PASS | "All matched files use Prettier code style!" |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M1-001 | unit | PASS | tests/unit/domain/valueObjects.test.ts:10. Exact `{ok:true,value}` for 0 and 999 999 999 999; exact `{code:"BR-GEN-001",messageKey:"errors.money.invalid",field}` for -1, 1.5, 10^12 |
| TC-M1-002 | unit | PASS | valueObjects.test.ts:21. Accepts 0/2000/10000; rejects -1/10001/12.5 with BR-GEN-003 `errors.format` (DM-001) |
| TC-M1-003 | unit | PASS | valueObjects.test.ts:30. 2026-02-28 ok; 2026-02-30 and 26-1-1 give BR-GEN-003; "" gives BR-GEN-002 `errors.required` (DM-001) |
| TC-M1-004 | unit | PASS | valueObjects.test.ts:40. `" ab-12c "` becomes `AB-12C`; `a` and `ab$12` are rejected with BR-GEN-003 |
| TC-M1-005 | unit | PASS | valueObjects.test.ts:46. `a@b.co` ok, null ok (value null), `a@b` gives BR-GEN-003 |
| TC-M1-006 | unit | PASS | tests/unit/format/format.test.ts:9. All 5 accepted inputs map to exact minor units (123456 / 1200); `1.234`, `1,234`, `abc` give the exact BR-GEN-001 error |
| TC-M1-007 | unit | PASS | format.test.ts:23. `toBe("€1,234.56")`, `toBe("33.3 %")`, `toBe("—")` |
| TC-M1-008 | unit | PASS | format.test.ts:29. `toBe("05.03.2026")` |
| TC-M1-009 | unit | PASS | format.test.ts:33. 2000, 950, and `ok === false` for "20.125" |
| TC-M1-010 | integration | PASS | tests/integration/migrations.test.ts:31. Exact table list (7) and index list (8) of DS-003; `schema_migrations = [{version:1, applied_at}]`. Extra test at :43 asserts `0001_init.sql` (minus header) equals the DS-003 SQL block from the spec byte for byte |
| TC-M1-011 | integration | PASS | migrations.test.ts:54. Second run returns `[]`; schema_migrations count 1; settings count 1 |
| TC-M1-012 | integration | PASS | migrations.test.ts:64. `PRAGMA foreign_keys` gives `[{foreign_keys:1}]` |
| TC-M1-013 | integration | PASS | migrations.test.ts:69. INCOMING+sub and OUTGOING without sub reject with `/CHECK constraint failed/`; valid combinations accepted (control) |
| TC-M1-014 | integration | PASS | tests/integration/settings.test.ts:21. Default `{EUR,2000}`; after update, a fresh repo instance reads `{RSD,1000}` |
| TC-M1-015 | integration | PASS | settings.test.ts:32. Exact error `{BR-GEN-003, errors.format, field:"defaultVatRate"}`; DB row still `EUR/2000` |
| TC-M1-016 | integration | PASS | tests/integration/documentStorage.test.ts:7. Ref path `invoice-1/<uuid>.pdf` (DS-004); exists true, then remove, then false |
| TC-M1-020 | e2e | PASS | tests/e2e/shell.spec.ts:49. `/` redirects to `/projects`; 11 `nav-*` test ids and labels in exact UI-001 order; "Analytics" divider; `__TEST__` hooks present, no `__TAURI_INTERNALS__` |
| TC-M1-021 | e2e | PASS | shell.spec.ts:70. Every item: URL matches route, `screen-title` equals label, placeholder "Coming in Mx" per UI-001 table |
| TC-M1-022 | e2e | PASS | shell.spec.ts:82. Defaults EUR/20, "In-memory (browser mode)" shown, "Open folder" hidden; RSD/10 then save shows toast "Saved"; sidebar nav to Projects and back keeps RSD/10 (no reload) |
| TC-M1-023 | e2e | PASS | shell.spec.ts:107. On all 11 screens, no visible line matches `/^[a-z]+(\.[a-zA-Z]+)+$/` |
| TC-M1-024 | lint | PASS | Created `src/core/__boundary_probe.ts` importing `../adapters/system/SystemClock`. `yarn lint` exit 1: `There is no policy allowing dependencies from elements of type "core-other" to elements of type "adapters"`. Probe deleted (verified absent); `yarn lint` exit 0. Extra stdin probes (no files written) also rejected ui→adapters, core→react, core→node:fs, ui→core/domain value import, adapters→ui |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0: Node v22.23.3; Corepack 0.36.0; Yarn 4.18.1 = packageManager; rustc/cargo 1.99.1; targets aarch64-apple-darwin, x86_64-apple-darwin, x86_64-pc-windows-msvc; Xcode CLT; cargo-xwin 0.23.1; makensis v3.13; Homebrew clang 23.1.5; llvm-lib; Homebrew LLD 23.1.5 (lld-link); sqlite3 3.54.0 |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0: release `.app` built; `.../Architecture Project Tracker.app/Contents/MacOS/archtracker` started with `ARCHTRACKER_DATA_DIR=<tmp>`; "app alive, tracker.db created, migration version 1 recorded"; PASS. Run twice (standalone and inside verify) |
| TC-M1-031 | local | PASS | `yarn build:win-cross` exit 0; `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Architecture Project Tracker_0.1.0_x64-setup.exe`, 3 773 398 bytes (> 1 MB), mtime 23:43:57, after the 23:43:31 run start (freshly produced) |
| TC-M1-032 | ci | PENDING-CI | Step `TC-M1-032 Windows installer smoke test` exists in `.github/workflows/windows-build.yml` (silent `/S` install, start with `ARCHTRACKER_DATA_DIR`, 20 s wait, alive + `tracker.db` + version 1, kill, uninstall). Branch not pushed (`git ls-remote` empty; `gh` reports no workflow runs), so it has not run |

Counts: unit 9/9, integration 8/8, e2e 4/4 (21 automated tests). 20 automated M1 TCs PASS, 1 lint PASS, 3 local PASS, 1 ci PENDING.

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS (1 note) | Every `.ts/.tsx/.sql` file under `src/` starts with `// Spec:` / `-- Spec:`, and all referenced IDs exist in `spec/`. `src/ui/i18n/en.json` has no header because JSON cannot hold comments (finding 1) |
| T2 Changes map to scope | PASS | `specCommit` is null, so the scope is all of M1. `git diff --stat`: only `README.md` (deliverable 12). Untracked files are all M1 deliverables 1–12 (scaffold, configs, `scripts/*.mjs`, `src-tauri/*`, workflow, `src/**`, `tests/**`). Helper modules (`SerialQueue`, `runInTransaction`, `bundledMigrations`, `Container`, `testHooks`, `navigation`, `Root`, `App`) support in-scope IDs. No out-of-scope behaviour found |
| T3 Empty spec diff ⇒ no code diff | N/A | M1 is `pending` |
| T4 Architecture / deps | PASS | `src/core` imports only relative paths within core, with no window/document/process/crypto/fetch use. `src/ui` has no `adapters` import and imports `core/domain` as `import type` only. `package.json`: 18 deps + 15 devDeps match AR-006a exactly. Installed majors: React 18.3, RR 6.30, Mantine 7.17, TS 5.9, Vite 5.4, Vitest 2.1, PW 1.65, ESLint 9.39, ts-eslint 8.72, Prettier 3, Tauri CLI/API 2.12, plugins 2.x, sql.js 1.15, @types/node 22. Cargo: tauri 2.12.5, tauri-build 2.7.4, plugin-sql 2.6.0 (`sqlite`), fs/dialog/opener 2.x, serde 1, serde_json 1. `.yarnrc.yml`, `packageManager`, `engines.node ">=22 <23"`, `.nvmrc` 22, `rust-toolchain.toml` all match AR-006 |
| T5 i18n | PASS | No JSX text nodes or string-valued visible props with letters in `src/ui/**/*.tsx`. All 14 `t()` keys used exist in `en.json`. Currency option labels are ISO codes from DM-060 |

## Spot review (business rules)
1. **BR-GEN-001 / DM-001 Money**: `src/core/domain/Money.ts` checks `Number.isSafeInteger && 0 ≤ v ≤ 999 999 999 999` and returns `BR-GEN-001`/`errors.money.invalid`. Matches. `parseMoney` (`src/ui/format/money.ts`) uses the UI-002 rule: the last separator is the decimal with 1–2 digits, earlier separators must be the other character and group exactly 3 digits.
2. **BR-GEN-003 / DM-060 Settings**: `src/core/usecases/settings/updateSettings.ts` validates currency against `EUR,RSD,USD,CHF,GBP` and VatRate 0…10000 (both `BR-GEN-003`/`errors.format` with field) **before** calling `settingsRepo.update`, so invalid input is never persisted. Matches.
3. **BR-GEN-002 / DM-001 DateOnly / VatNumber**: an empty value after trim returns `BR-GEN-002`/`errors.required`; a bad format or impossible calendar date (leap-year aware) returns `BR-GEN-003`. VatNumber is 3–20 `[A-Za-z0-9-]`, stored upper-case. Matches.

Also checked: AR-010 (composition runs open, migrations in a transaction, then `INSERT OR IGNORE` settings; failure shows `StartupErrorScreen` with message + DB path); AR-009 (`__TAURI_INTERNALS__` detection; `__TEST__` only when `MODE === "e2e"`; Rust `get_data_dir` + `ARCHTRACKER_DATA_DIR` override); UI-001 window title/sizes in `tauri.conf.json`; deliverable 1 identifiers and version 0.1.0 in both files; deliverable 11 workflow steps; deliverable 12 README contents.

## Findings
None block the verdict.
1. Low — R3 / AR-008 (T1): `src/ui/i18n/en.json` has no `Spec:` header because JSON has no comment syntax. Proposed spec amendment (AR-008): "JSON files are exempt from the `Spec:` header; their IDs are listed in the header of the module that loads them (e.g. `src/ui/i18n/index.ts` → UI-090)." No code change needed.
2. Low — UI-080 / AR-009: `src-tauri/capabilities/default.json` limits `opener:allow-open-path` to `$APPDATA` / `$APPDATA/**`. When `ARCHTRACKER_DATA_DIR` points elsewhere, the Settings "Open folder" button would be denied by the opener scope. Today the override is only used by the smoke tests, so there is no user impact, but it is not covered by any TC. (`lib.rs` extends the fs scope dynamically to the effective data dir, but not the opener scope.)
3. Info — DS-001 / AR-004: `TauriSqlDriver.open` runs `PRAGMA foreign_keys = ON` once on a pooled `tauri-plugin-sql` (sqlx) connection. Per-connection FK enforcement and BEGIN/COMMIT on the same connection depend on sqlx defaults (`foreign_keys=ON`) and the serial queue keeping one active connection. The smoke test shows migrations commit correctly. Recommend a Tauri-mode FK check when M2 adds repositories.
4. Info — AR-010: `src/main.tsx` turns a failed `getSettings` into `StartupError(messageKey)`, which is displayed untranslated. This is unreachable today (`getSettings` always returns ok).

## Manual steps for the user
- **TC-M1-032 (PENDING-CI):** after you allow a push of `mx/m1-initial-setup`, check the `windows-build` run with
  `gh run list --branch mx/m1-initial-setup --workflow windows-build.yml` and `gh run view <id>`. Confirm that `yarn test`
  and `yarn build` pass, the `windows-installer` artifact contains `Architecture Project Tracker_0.1.0_x64-setup.exe`,
  and the step `TC-M1-032 Windows installer smoke test` succeeds. Note: GitHub will only list the workflow by file name once it exists on the default branch, but `on: push` still triggers it on the feature branch.
- Optional (finding 2): with `ARCHTRACKER_DATA_DIR` set, run the app and click "Open folder" on Settings to see whether the opener scope blocks it.
