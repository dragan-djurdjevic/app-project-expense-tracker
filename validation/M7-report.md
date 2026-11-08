# M7 validation — 2026-11-08 — spec 0.5.1 @ ef45929
Verdict: PASS-WITH-PENDING

Round 2. Target: M7 (Demo mode), uncommitted working tree on branch `spec/m7-demo-mode`. Regression: M1–M6 (done).
`spec-lock.json` specCommit = 7178af3 (0.4.0). Spec diff 7178af3..HEAD: OV-005, AR-007, AR-009, AR-010 (3a),
AR-012 (demo row), AR-013, DEMO-001…004, DEMO-900…906, UI-003, UI-080, UI-081, UI-091 glossary, milestone M7.

## Gates
| Gate | Result | Notes |
|---|---|---|
| G1 `yarn install --immutable` | PASS | exit 0, lockfile unchanged |
| G2 `yarn typecheck` | PASS | exit 0 |
| G3 `yarn lint` | PASS | exit 0 |
| G4 `yarn test:unit` | PASS | 11 files, 32 tests |
| G4 `yarn test:integration` | PASS | 10 files, 62 tests (demoSeed.test.ts: 6) |
| G4 `yarn test:e2e` | PASS | 43 passed (demo.spec.ts: 5) |
| G5 `yarn spec:trace M7` | PASS | M1–M6 also exit 0 |

## Test cases
| TC | Level | Result | Evidence |
|---|---|---|---|
| TC-M7-001 | unit | PASS | tests/unit/app/profile.test.ts:6, all 7 inputs asserted with exact values |
| TC-M7-002 | unit | PASS | tests/unit/app/resolveDemoDate.test.ts:10, all 7 values incl. clamp to 2026-01-03 and leap-year 2024-03-01 |
| TC-M7-003 | integration | PASS | tests/integration/demoSeed.test.ts:279, counts 4/5/8/20/39, 28/6/2/3 statuses, archived set exactly I4,S5,P6,C19,V32, every field of every row (I compared the test constants with the DEMO-003 tables myself: they match) |
| TC-M7-004 | integration | PASS | demoSeed.test.ts:394, availableYears; AN-1 2026/2025/2024/All rows and footers, Gross; AN-2 2026 rows, sub-rows and footer, 2025 + All footers, P2 106.7 %; AN-3 2026/2025/2027; AN-4 2026/All/Gross (margin 80.8 %); AN-5 all rows + footer |
| TC-M7-005 | integration | PASS | demoSeed.test.ts:~620, 6 Y0 contracts + 15 Y0 invoices in [2026-01-01, 2026-01-03]; AN-1/AN-4/AN-5 footers; overdue {SH-2502, SH-2503}; June set = DEMO-906 |
| TC-M7-006 | integration | PASS | demoSeed.test.ts, id/updated_at snapshot of all 5 tables unchanged after second run; DB with one archived investor not seeded |
| TC-M7-007 | integration | PASS | demoSeed.test.ts, exactly 3 attachments LV-2401.pdf/HL-2501.pdf/GO-2601.pdf, 3 stored docs, `%PDF-`, ≤ 10 kB |
| TC-M7-008 | integration | PASS | demoSeed.test.ts, every status, P2 > 100 % and remaining < 0, P5 null, P7 no contracts, C09 35,000 > 30,000, VAT 2000/1000/0 |
| TC-M7-009 | e2e | PASS | tests/e2e/demo.spec.ts:36 |
| TC-M7-010 | e2e | PASS | demo.spec.ts:46, banner on all 11 UI-001 screens, title `/— Demo$/`, 7/8 rows, footer €1,100,000.00 / €600,000.00 / 54.5 %, P2 bar value 110 and red |
| TC-M7-011 | e2e | PASS | demo.spec.ts:76, cancel → still live and switch off; confirm → demo; banner button → live, "No records yet." |
| TC-M7-012 | e2e | PASS | demo.spec.ts:102 |
| TC-M7-013 | e2e | PASS | demo.spec.ts:127, sr-Latn banner, banner button, help text, reset button and dialog title; no key-like lines |
| TC-M7-014 | local | PASS | `yarn smoke:mac` exit 0: live check, then (1)–(4) OK, `<root>/tracker.db` SHA-256 unchanged after (2), (3), (4) |
| TC-M7-015 | ci | PENDING-CI | branch not pushed (`git ls-remote` empty, no `windows-build` run). Step `TC-M7-015 Windows demo profile smoke test` is in the workflow; step (3) now checks the UPDATE before creating `.reset` |
| TC-M7-016 | lint | PASS | `yarn lint` clean. ESLint stdin probes (no files written): `src/app/demo` → `src/adapters` error, `src/app/demo` → `SqlDriver` error, `src/ui` → `src/app/demo` error, `src/app/demo` → `src/core` / `src/app` allowed. grep: no `SqlDriver`/adapters in `src/app/demo`, no `profile`/`demo` in `src/core` |
| TC-M7-017 | manual | MANUAL | see below |
| TC-M1-024 | lint | PASS | probe `src/core/__boundary_probe.ts` → lint exit 1 (boundaries/dependencies); probe deleted → lint exit 0 |
| TC-M1-025 | local | PASS | `yarn check:env` exit 0, "All prerequisites present." |
| TC-M1-030 | local | PASS | `yarn smoke:mac` exit 0 (migration versions 1, 2) |
| TC-M1-031 | local | PASS | `yarn build:win-cross` exit 0, `Architecture Project Tracker_0.1.0_x64-setup.exe` 3,828,447 bytes |
| TC-M1-032 | ci | PENDING-CI | branch not pushed |
| TC-M4-030, TC-M6-013 | manual | MANUAL | unchanged from earlier milestones |
| All other M1–M6 automated TCs | unit/integration/e2e | PASS | green in G4 and G5; no M1–M6 test file changed in the working tree (incl. TC-M1-020, TC-M6-001) |

## Traceability & scope
| Check | Result | Notes |
|---|---|---|
| T1 Spec headers | PASS | every `.ts/.tsx/.sql` file under `src/` has a `Spec:` header that lists only existing IDs (the JSON/PDF files can't have headers) |
| T2 Scope | PASS | all working-tree changes map to M7 IDs (AR-009/010/012/013, DEMO-*, UI-003, UI-081). The committed code diff since 7178af3 is the validated M6 commit 798f90d (spec 0.4.0 = specCommit) |
| T3 | n/a | spec diff is not empty |
| T4 Architecture | PASS | lint boundaries clean; `package.json`, `yarn.lock`, `Cargo.toml`, `Cargo.lock` unchanged |
| T5 i18n | PASS | new JSX uses only `t()`; English texts match UI-003/UI-081 word for word; en and sr-Latn have the same 191 keys |

## Findings
Both round-1 findings are fixed:
- (was MAJOR, AR-013 step 4) `fs:default` has been removed from `src-tauri/capabilities/default.json`. The fs scope is
  now only the runtime `allow_directory(<active profile>/documents)` in `lib.rs`.
- (was MINOR, AR-012 / TC-M7-015) the workflow step (3) now throws if the names after the UPDATE are not
  `Changed|Changed|Changed|Changed`.

Nothing new that blocks.
1. INFO AR-013. This is not a failure of this milestone. `opener:allow-open-path` (from M4, not changed here) still
   allows `$APPDATA/**`. That means the OS opener could open files of the other profile, although the app never
   asks it to. If AR-013's "never read" should also cover the OS opener, amend the spec so that it scopes the opener
   to the active profile's `documents/`.

Spot review (no findings): DEMO-001 (use cases only; PAID created as ISSUED and then changed; attachments before
archiving; archive order V32→C19→P6→I4→S5; no-op if any investor **or** project exists, archived included; `ok:false`
throws and becomes a `StartupError` with the DB path); DEMO-002 (local date of `Clock.now()`, only offset 0 is
clamped, due date +30 days computed UTC-safe); AR-013 Rust (missing/invalid `profile.json` → live; `.reset` only
honoured in demo, before any DB opens; `reset_demo` refuses in live; `switch_profile` writes the file, then restarts;
demo window title set at setup).

## Manual steps for the user
- TC-M7-017 (macOS Tauri app, `yarn tauri build --bundles app`, normal app data dir):
  1. Settings → toggle Demo mode → "Restart in demo mode". Check: orange banner on every screen, the window title ends
     with "— Demo", and every list and analytics screen shows data.
  2. Invoices → LV-2401 → "Open PDF". It should open in the OS viewer and show "SAMPLE INVOICE — DEMO DATA".
  3. Settings: the DB path and documents path point into `<app data>/demo/`.
  4. Change a record, then Settings → "Reset demo data" → "Reset and restart". The sample data is back.
  5. Banner → "Switch to live data" → confirm. Your real data is unchanged and there is no banner.
- TC-M4-030 and TC-M6-013: as in earlier milestones.
- CI (needs your permission to push): push the branch and check the `windows-build` run for the steps TC-M1-032 and
  TC-M7-015.
