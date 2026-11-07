# Spec changelog

Every spec change gets an entry here **in the same commit** as the spec edit. Format:

```
## <version> — <YYYY-MM-DD>
- ADDED|CHANGED|REMOVED <spec ID>: <what and why>
```
Bump rules: PATCH = wording/clarification with no behaviour change; MINOR = new or changed behaviour;
MAJOR = reserved for post-POC breaking changes.

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
