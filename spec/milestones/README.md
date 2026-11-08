# Milestones

| Milestone | Title | Depends on |
|---|---|---|
| [M1](M1.md) | Initial app setup (installer, architecture, DB, settings) | — |
| [M2](M2.md) | Investor, Subcontractor, Project CRUD | M1 |
| [M3](M3.md) | Contract CRUD | M2 |
| [M4](M4.md) | Invoice CRUD + PDF | M3 |
| [M5](M5.md) | Analytics views | M4 |
| [M6](M6.md) | Serbian (Latin) language | M5 |
| [M7](M7.md) | Demo mode | M6 |

## Test case conventions
- ID format `TC-M<n>-<nnn>`. IDs are never renumbered or reused; removed TCs are struck through and marked
  `REMOVED in spec vX.Y.Z`.
- **Level** decides where the test lives:
  | Level | Location / runner |
  |---|---|
  | unit | `tests/unit/**` (Vitest, core only, no DB) |
  | integration | `tests/integration/**` (Vitest, real repositories on `SqlJsDriver`) |
  | e2e | `tests/e2e/**` (Playwright, browser mode) |
  | lint | performed by the validator agent (see TC description) |
  | local | package script run by the validator on the dev machine (no push needed) |
  | ci | step in `.github/workflows/windows-build.yml` named with the TC ID (needs a push; only for what requires Windows) |
  | manual | not automated; the validator lists it as `MANUAL` in the report for the user to confirm |
- Test titles start with the TC ID so `yarn spec:trace` can find them. `lint`, `local`, `ci` and `manual` TCs are
  traced by the validator instead.

## Coverage map (spec ID → milestone)
| Spec area | IDs | Milestone(s) | Key TCs |
|---|---|---|---|
| Value objects | DM-001, BR-GEN-001/003 | M1 | TC-M1-001…009 |
| Schema & migrations | DS-001…DS-005 | M1 | TC-M1-010…013 |
| Settings | DM-060, UI-080 | M1 | TC-M1-014, 015, 022 |
| Document storage | AR-004 DocumentStorage, DS-004 | M1, M4 | TC-M1-016, TC-M4-008…011, 030 |
| Shell, navigation, i18n | UI-001, UI-090 | M1 | TC-M1-020, 021, 023 |
| Layer boundaries | AR-002 | M1 | TC-M1-024 |
| Dev environment | AR-006 versions, AR-012 prerequisites | M1 | TC-M1-025 |
| Local app smoke + installer | OV-003, AR-009 data dir, AR-011, AR-012 | M1 | TC-M1-030, 031 (local), 032 (ci) |
| Investor | DM-010, BR-INV-001, UI-010/011 | M2 | TC-M2-001…009, 026, 030, 031 |
| Subcontractor | DM-020, BR-SUB-001, UI-020/021 | M2 | TC-M2-010, 011, 032 |
| Project | DM-030, BR-PRJ-001, UI-030…032 | M2 | TC-M2-020…025, 033…036 |
| Archive rules | BR-GEN-004…008, UI-002a | M2–M4 | TC-M2-006…008, 021, 022, 025, 035; TC-M3-004, 005, 011; TC-M4-003, 011 |
| Contract | DM-040, BR-CON-001…005, UI-040/041 | M3 | TC-M3-001…024 |
| Invoice | DM-050, BR-IVC-001…008, UI-050…053 | M4 | TC-M4-001…027 |
| Analytics | AN-000…AN-4, AN-900…904, UI-060…064 | M5 | TC-M5-001…012, 015, 020…027 |
| Budget realisation | AN-5, AN-905, UI-065, UI-033 | M5 | TC-M5-013, 014, 028, 029 |
| Projects year filter | UI-030 / AN-3 | M2, M5 | TC-M2-024, 034, TC-M5-012 |
| Language (Serbian Latin) | DM-060 language, DS-006, UI-002, UI-080, UI-090, UI-091, AR-010 | M6 | TC-M6-001…013 |
| Demo mode, profile separation | AR-009, AR-010, AR-012, AR-013, DEMO-001…004, DEMO-900…906, UI-003, UI-080, UI-081 | M7 | TC-M7-001…017 |
