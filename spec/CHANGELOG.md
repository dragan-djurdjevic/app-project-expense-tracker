# Spec changelog

Every spec change gets an entry here **in the same commit** as the spec edit. Format:

```
## <version> — <YYYY-MM-DD>
- ADDED|CHANGED|REMOVED <spec ID>: <what and why>
```
Bump rules: PATCH = wording/clarification with no behaviour change; MINOR = new or changed behaviour;
MAJOR = reserved for post-POC breaking changes.

## 0.3.4 — 2026-11-08
- CHANGED UI-010: Projects column counts non-archived projects of any status.
- CHANGED AR-004: `ProjectRepository` exposes `availableYears()` (AN-000h), reused by `AnalyticsQuery` in M5.
- CHANGED AR-005: `get` on an unknown id returns `null`; `update`/`archive`/`restore` on an unknown id throw;
  validation returns the first failing rule in form field order.
- CHANGED BR-GEN-004: restoring an active record is a no-op success.
- CHANGED UI-002b: edit-form pickers also show the currently referenced (possibly archived) parent; read-only view
  title is "<Entity>".
- CHANGED UI-002a: "No records match your search." only when search text is non-empty.
- CHANGED UI-032: screen title is the project name; summary cards show 0 until M3/M4.

## 0.3.3 — 2026-11-07
- CHANGED M1 deliverable 11: CI triggers are `push` to `main`, `pull_request` and `workflow_dispatch`, so a PR branch
  runs CI once per update instead of twice.

## 0.3.2 — 2026-11-07
- CHANGED TC-M1-022: persistence checked via client-side navigation, not page reload (browser mode DB is in-memory, AR-009).
- CHANGED AR-004: `DocumentStorage.save` takes `ownerId` so paths follow DS-004; ADDED `SettingsRepository` port.
- ADDED AR-006a: explicit list of allowed npm packages and Cargo crates.
- CHANGED UI-001: routes, sidebar `data-testid`s, placeholders, `/` redirect, `screen-title`.
- CHANGED UI-002, TC-M1-006: precise `parseMoney` separator rule (`1,234` → error, `1.234,56` → 123456).
- CHANGED UI-080: browser-mode paths text and hidden "Open folder".
- CHANGED DM-001: error codes per value object. CHANGED DM-060: allowed currencies EUR, RSD, USD, CHF, GBP.
- CHANGED M1: scope includes AR-006a and types only for DM-010…DM-050 / AN-1…AN-5; app version `0.1.0`.

## 0.3.1 — 2026-11-07
- CHANGED AR-012, TC-M1-025: `lld` (provides `lld-link`) added to cross-build prerequisites; Homebrew ships it separately from `llvm`.

## 0.3.0 — 2026-11-07
- CHANGED AR-006: package manager npm → Yarn 4 via Corepack (`packageManager` pin, `nodeLinker: node-modules`,
  `yarn install --immutable`); lockfile `yarn.lock`.
- CHANGED AR-011, AR-012, M1 (deliverables 9/11, TC-M1-024/025/030/031): commands use `yarn`; env check verifies Yarn.

## 0.2.0 — 2026-11-07
- CHANGED AN-2: rows = AN-4 row set; added Collected, Subcontractor share % (paid ÷ collected), Retained by company,
  Retained %; sub-rows show share of collected. Worked example AN-902 updated.
- ADDED AN-5, AN-905, UI-065, UI-033: budget realisation report (budget vs contracted / invoiced / collected) and
  project detail card.
- CHANGED AR-006: Node 22 LTS via nvm (`.nvmrc`); Rust via rustup with `rust-toolchain.toml`.
- ADDED AR-012, AR-009 data dir override, AR-011 scripts `smoke:mac`, `build:win-cross`, `check:env`, `verify`:
  local verification before push.
- CHANGED M1: TC-M1-030 is now the local macOS app smoke test; ADDED TC-M1-025 (env check), TC-M1-031 (Windows
  cross-build), TC-M1-032 (Windows install smoke on CI).
- ADDED M5: TC-M5-013, 014, 015, 028, 029; CHANGED TC-M5-008, 023.

## 0.1.0 — 2026-11-07
- ADDED: initial spec (OV, AR, DM, BR, DS, UI, AN, M1–M5).
