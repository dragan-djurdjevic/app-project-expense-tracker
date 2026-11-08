# 01 — Architecture

## AR-001 Style: hexagonal (ports & adapters)
```
            ┌──────────────────────────── ui (React) ───────────────────────────┐
            │  screens, components, i18n — calls use cases only                 │
            └───────────────────────────────┬───────────────────────────────────┘
                                            │ depends on
            ┌───────────────────────────── core ─────────────────────────────────┐
            │  domain (entities, value objects, rules)                           │
            │  usecases (application services)                                   │
            │  ports (interfaces: repositories, DocumentStorage, Clock, ...)     │
            └───────────────────────────────▲───────────────────────────────────┘
                                            │ implements
            ┌──────────────────────────── adapters ──────────────────────────────┐
            │  sqlite (repositories over SqlDriver), storage (DocumentStorage),  │
            │  tauri (SqlDriver via tauri-plugin-sql, fs, dialog, opener)        │
            └────────────────────────────────────────────────────────────────────┘
```

## AR-002 Dependency rules (enforced by ESLint `eslint-plugin-boundaries`)
- `src/core/**` imports only from `src/core/**`. No React, no Tauri, no SQL, no Node/browser APIs
  (except `Intl`, `Date`, `Math`, `JSON`).
- `src/adapters/**` imports from `src/core/**` (ports, domain types) and third-party libs. Never from `src/ui/**`.
- `src/ui/**` imports from `src/core/usecases`, `src/core/domain` (types only) and `src/app/**`. Never from
  `src/adapters/**`.
- `src/app/**` (composition root) is the **only** place that wires adapters to use cases.

## AR-003 Replaceability
Switching the persistence (central DB or backend API) must require only:
1. a new implementation of the repository ports and `DocumentStorage` port in `src/adapters/<new>/`;
2. changing the wiring in `src/app/composition.ts`.
No change in `src/core/**` or `src/ui/**` is allowed for such a switch. Therefore:
- Ports are **async** (`Promise`-returning) even though SQLite is local.
- Ports speak domain types, never SQL rows.
- Aggregations for analytics go through an `AnalyticsQuery` port (an API backend can compute them server-side).

## AR-004 Ports (in `src/core/ports/`)
| Port | Purpose |
|---|---|
| `InvestorRepository` | `list(filter)`, `get(id)`, `create(input)`, `update(id, input)`, `archive(id)`, `restore(id)`, `existsByVat(vat, excludeId?)` |
| `SubcontractorRepository` | same shape as InvestorRepository |
| `ProjectRepository` | same shape (without `existsByVat`) plus `availableYears()` (AN-000h, used by UI-030; `AnalyticsQuery` reuses it in M5); list filter supports `investorId`, `status`, `year` (AN-3 rule) |
| `ContractRepository` | same shape plus `existsByNumber(projectId, number, excludeId?)` (case-insensitive as SQLite `COLLATE NOCASE`, i.e. ASCII letters only, matching `ux_contract_project_number`; includes archived contracts). `list(filter)` returns `ContractListItem` = Contract + `projectName`, `counterpartyName`, `invoiced`, `paid`. List filter supports `projectId`, `type`, `subcontractorId` |
| `InvoiceRepository` | same shape plus `existsByNumber(contractId, number, excludeId?)` (case-insensitive as SQLite `COLLATE NOCASE`, ASCII letters only, matching `ux_invoice_contract_number`; includes archived invoices). `list(filter)` returns `InvoiceListItem` = Invoice + `contractNumber`, `projectId`, `projectName`, `direction` (contract type), `vatAmount`, `gross` (the `listInvoices` use case adds `overdue: boolean`, computed from the `Clock`'s local date, DM-050); sorted by date desc, number asc (case-insensitive), id. List filter supports `contractId`, `projectId`, `status` (array), `direction` |
| `AnalyticsQuery` | `contractedVsCollected(year, mode)`, `subcontractorPayments(year, mode)`, `projectsInYear(year)`, `netPerProject(year, mode)`, `budgetRealisation(statuses)`, `availableYears()` (the port returns `[]` when empty; the `getAvailableYears` use case applies the AN-000h current-year fallback) |
| `SettingsRepository` | `get(): Promise<Settings>`, `update(settings): Promise<void>` (DM-060) |
| `DocumentStorage` | `save(bytes, originalName, ownerId): Promise<StoredDocumentRef>` (stores as `<ownerId>/<uuid>.pdf`, uuid from `IdGenerator`; `ownerId` = invoice id, DS-004), `open(ref)`, `remove(ref)`, `exists(ref)`. `InMemoryDocumentStorage.open` is a no-op in browser mode. |
| `Clock` | `now(): Date` (for timestamps; makes tests deterministic) |
| `IdGenerator` | `next(): string` (UUID v4; injectable for tests) |

`SqlDriver` (in `src/adapters/sqlite/SqlDriver.ts`) is an **adapter-internal** interface:
`execute(sql, params)`, `select<T>(sql, params)`, `transaction(fn)`. Implementations:
- `TauriSqlDriver` — `@tauri-apps/plugin-sql` (production).
- `SqlJsDriver` — `sql.js` (tests and browser E2E).
Both run the **same** repository code and migrations.

## AR-005 Use cases
One file per use case in `src/core/usecases/<entity>/`, e.g. `createProject.ts`. A use case:
- receives ports via a factory: `makeCreateProject({ projectRepo, investorRepo, clock, ids })`;
- validates input against business rules (`02-domain-model.md`), returns `Result<T, DomainError>`;
- never throws for business errors (throws only for programming/infra errors);
- `get` returns `null` for an unknown id; `update`/`archive`/`restore` on an unknown id are programming errors (throw);
- validation stops at the first failing rule and returns that single `DomainError`, checked in this order:
  (1) required/format/value-object rules and conditional presence rules (e.g. BR-CON-002 "required", BR-CON-003)
  in form field order; (2) reference rules (parent exists, parent active per BR-GEN-006) in form field order;
  (3) uniqueness rules (BR-INV-001, BR-SUB-001, BR-CON-004, BR-IVC-003). On `update`, BR-GEN-007 is checked first,
  then immutability rules (BR-CON-005, BR-IVC-002), then (1)–(3).

`DomainError` = `{ code: string /* e.g. "BR-PRJ-003" */, field?: string, messageKey: string }`.
The UI translates `messageKey` via i18n.

Exception — warnings: `createInvoice` / `updateInvoice` return `{ ok: true, value: Invoice, warnings: InvoiceWarning[] }`
on success, where `InvoiceWarning = "overInvoiced"` (BR-IVC-008) and `warnings` is `[]` when there is none.

## AR-006 Tech stack (major versions pinned; exact versions locked by committed `yarn.lock` / `Cargo.lock`)
| Concern | Choice |
|---|---|
| Shell | Tauri **2.x** (Rust stable via `rustup`, edition 2021; `src-tauri/rust-toolchain.toml` pins `channel = "stable"`, targets `aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-pc-windows-msvc`) |
| Language | TypeScript **5.x**, `strict: true` |
| UI | React **18.x**, React Router **6.x** |
| UI kit | Mantine **7.x** (tables, forms, date inputs, modals, notifications) |
| Build | Vite **5.x** |
| i18n | i18next + react-i18next |
| DB | SQLite via `@tauri-apps/plugin-sql` 2.x; `sql.js` 1.x for tests |
| Files | `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-opener` 2.x |
| Unit/integration tests | Vitest **2.x** |
| E2E | Playwright **1.x** (Chromium) against `vite preview` in **browser mode** (see AR-009) |
| Lint/format | ESLint 9 (flat config) + `eslint-plugin-boundaries`, Prettier 3 |
| Package manager | **Yarn 4.x** via Corepack (exact version pinned in `package.json` `packageManager`, set in M1 with `corepack use yarn@4`; `.yarnrc.yml`: `nodeLinker: node-modules`, `enableTelemetry: false`; installs always `yarn install --immutable` in CI and validation). Node **22 LTS** managed by **nvm** (`.nvmrc` = `22`; `package.json` `engines.node` = `>=22 <23`) |
| CI | GitHub Actions, `windows-latest` |

No other runtime dependencies may be added unless the spec lists them.

## AR-006a Allowed packages (all installed in M1)
The **complete** list of direct dependencies; anything not listed here is forbidden (major versions given).
- **dependencies:** `react`, `react-dom` 18; `react-router-dom` 6; `@mantine/core`, `@mantine/hooks`, `@mantine/form`,
  `@mantine/dates`, `@mantine/modals`, `@mantine/notifications` 7; `dayjs` 1; `i18next`; `react-i18next`;
  `@tauri-apps/api`, `@tauri-apps/plugin-sql`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`,
  `@tauri-apps/plugin-opener` 2; `sql.js` 1.
- **devDependencies:** `typescript` 5; `vite` 5; `@vitejs/plugin-react` 4; `vitest` 2; `@playwright/test` 1;
  `eslint` 9; `@eslint/js` 9; `typescript-eslint` 8; `eslint-plugin-boundaries`; `prettier` 3; `@tauri-apps/cli` 2;
  `@types/react`, `@types/react-dom` 18; `@types/sql.js`; `@types/node` 22.
- **Cargo (`src-tauri/Cargo.toml`):** `tauri` 2, `tauri-build` 2, `tauri-plugin-sql` 2 (feature `sqlite`),
  `tauri-plugin-fs` 2, `tauri-plugin-dialog` 2, `tauri-plugin-opener` 2, `serde` 1, `serde_json` 1.
- UUIDs use `crypto.randomUUID()` (no uuid package).

## AR-007 Folder structure
```
src/
  core/
    domain/          # entities, enums, value objects (Money, VatRate), rules, DomainError, Result
    ports/           # interfaces listed in AR-004
    usecases/
      investor/ subcontractor/ project/ contract/ invoice/ analytics/
  adapters/
    sqlite/          # SqlDriver, SqlJsDriver, migrations runner, *SqliteRepository, SqliteAnalyticsQuery
      migrations/    # 0001_init.sql, 0002_..., numbered, never edited after release
    storage/         # FsDocumentStorage (Tauri), InMemoryDocumentStorage (tests/browser)
    tauri/           # TauriSqlDriver, platform helpers
    system/          # SystemClock, UuidIdGenerator
  app/
    composition.ts   # builds the container: chooses Tauri vs browser adapters
    AppProvider.tsx  # React context exposing use cases
    demo/            # demo seed (DEMO-001), dataset (DEMO-003), assets/ with demo PDFs (DEMO-004)
  ui/
    screens/         # one folder per screen (UI-* IDs)
    components/      # shared: DataTable, MoneyInput, YearFilter, ConfirmDialog, ...
    i18n/            # en.json, sr-Latn.json, index.ts
    format/          # money/date/percent formatting
  main.tsx
src-tauri/           # Tauri Rust shell, tauri.conf.json, capabilities
tests/
  unit/              # core, pure
  integration/       # adapters on SqlJsDriver
  e2e/               # Playwright
  fixtures/          # shared seed data (incl. AN worked examples)
validation/          # validator reports Mx-report.md
```

## AR-008 Naming & code conventions
- Files: `camelCase.ts` for functions/use cases, `PascalCase.ts(x)` for types/classes/components.
- DB columns `snake_case`; TS properties `camelCase`; mapping only inside sqlite adapters.
- IDs are UUID v4 strings.
- Dates: `date` fields stored as ISO `YYYY-MM-DD` text; timestamps as ISO 8601 UTC text.
- Money: integer minor units (`number`, safe-integer checked). VAT rate: integer basis points (2000 = 20.00 %).
- Each source module begins with a header comment: `// Spec: <ID>, <ID>, ...` listing the IDs it implements.
- Each test title begins with its TC ID: `it("TC-M2-004 rejects duplicate VAT", ...)`.
- No `any`. No default exports except React screen components.

## AR-009 Runtime modes
`src/app/composition.ts` detects the runtime:
- **Tauri mode** (`window.__TAURI_INTERNALS__` present): `TauriSqlDriver` with DB file `tracker.db` in the active
  profile's data dir (AR-013), `FsDocumentStorage` writing to `<profile data dir>/documents/`.
- **Data root override:** if the environment variable `ARCHTRACKER_DATA_DIR` is set when the app starts, the Rust side
  uses it instead of the app data dir as the data root `<root>` (AR-013). The frontend gets the effective path of
  the **active profile's** data dir from the Tauri command `get_data_dir`. Used by the smoke tests (AR-012) so they
  never touch the user's real data.
- **Browser mode** (no Tauri): `SqlJsDriver` in memory, `InMemoryDocumentStorage`. Used only by E2E tests and
  `yarn dev:web`. Browser mode exposes `window.__TEST__ = { reset(), seed(fixtureName) }` **only** when
  `import.meta.env.MODE === "e2e"`. The profile in browser mode is defined in AR-013.

## AR-010 Startup sequence
1. Open DB (create file if missing).
2. Run pending migrations in a transaction (table `schema_migrations(version INTEGER PK, applied_at TEXT)`).
3. Ensure `settings` row exists (default currency `EUR`, default VAT 2000 bp, language `en`); load settings and set
   the UI language (UI-090).
3a. Only in the `demo` profile (AR-013): run the demo seed (DEMO-001; a no-op when demo data already exists). A
   loading indicator is shown while seeding.
4. Render app shell. If steps 1–2 or 3a fail, show a full-screen error with the message and the DB path.

## AR-011 package.json scripts (contract for agents)
| Script | Does |
|---|---|
| `dev` | `tauri dev` |
| `dev:web` | Vite dev server in browser mode |
| `build` | `tauri build` (NSIS installer on Windows) |
| `typecheck` | `tsc --noEmit` |
| `lint` | ESLint over `src` and `tests` |
| `test:unit` | Vitest `tests/unit` |
| `test:integration` | Vitest `tests/integration` |
| `test:e2e` | builds in `e2e` mode, runs Playwright |
| `test` | typecheck + lint + unit + integration + e2e |
| `smoke:mac` | `scripts/smoke-mac.mjs` — see AR-012 |
| `build:win-cross` | `tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --bundles nsis` (cross-compiles the Windows installer on macOS) |
| `check:env` | `scripts/check-env.mjs` — verifies AR-012 prerequisites (incl. Node 22, Corepack enabled, Yarn version = `packageManager`) |
| `verify` | `test` + `smoke:mac` + `build:win-cross` — everything the validator checks locally before a push |
| `spec:trace` | script `scripts/trace.mjs`: lists every `TC-*` in `spec/milestones/*.md` and whether a test title with that ID exists; exits non-zero if any TC of a given milestone is missing (`yarn spec:trace M2`) |

## AR-012 Local verification before push
Goal: confirm as much as possible locally; CI only adds what physically needs Windows.

| Check | Where | How |
|---|---|---|
| Real Tauri app starts, SQLite plugin works, migrations run | local (macOS) | `yarn smoke:mac`: `tauri build --bundles app`; start `<bundle>.app/Contents/MacOS/<binary>` with `ARCHTRACKER_DATA_DIR=<fresh temp dir>`; wait up to 20 s; assert the process is alive, `tracker.db` exists and `sqlite3 tracker.db "SELECT version FROM schema_migrations ORDER BY version"` prints the versions of all migrations (`1`, `2`; DS-006); kill the process; delete the temp dir. Exit code ≠ 0 on any failure. |
| Windows installer builds | local (macOS cross-compile) | `yarn build:win-cross` produces `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.exe`; validator asserts the file exists and is > 1 MB. Tauri marks this cross-compile as experimental; if it breaks for tooling reasons, the validator reports it as FAIL with the error, never silently skips it. |
| Installer installs and app starts on Windows | CI (`windows-latest`) | Same checks as `smoke:mac`, but on the installed app after a silent NSIS install. Needs a push. |
| Demo profile is separate, seeded and resettable | local (macOS) | `yarn smoke:mac` continues after the check above, with the same temp `<root>` and the same bundle. Each start waits up to 30 s for its condition, then kills the process. **(1)** Start live → `<root>/tracker.db` has 0 investors; record its SHA-256. **(2)** Write `<root>/profile.json` = `{"profile":"demo"}`, start → `<root>/demo/tracker.db` has 4 investors and 39 invoices (DEMO-003), `<root>/demo/documents/` holds 3 `.pdf` files. **(3)** Run `UPDATE investor SET name = 'Changed'` on the demo DB, create `<root>/demo/.reset`, start → all 4 investor names are as in DEMO-003 and `.reset` is gone. **(4)** Write `{"profile":"live"}`, start → `<root>/tracker.db` still has 0 investors. After each of (2)–(4), the SHA-256 of `<root>/tracker.db` equals the value recorded in (1). |

**Developer machine prerequisites (macOS):**
- nvm with Node 22 (`nvm install` in the repo root reads `.nvmrc`); `corepack enable` once per Node install (makes the pinned Yarn 4 available).
- Rust via Homebrew `rustup` (`brew install rustup`, `rustup default stable`); `/opt/homebrew/opt/rustup/bin` and
  `~/.cargo/bin` on `PATH`.
- Xcode Command Line Tools.
- For `build:win-cross`: `brew install nsis llvm lld`, `cargo install --locked cargo-xwin`,
  `rustup target add x86_64-pc-windows-msvc`, and `$(brew --prefix llvm)/bin` on `PATH`.
- `README.md` lists these; `scripts/check-env.mjs` (`yarn check:env`) verifies them and prints what's missing.

## AR-013 Profiles: live and demo data separation
The app has two **profiles**: `live` (the user's real data, default) and `demo` (sample data, `06-demo.md`). Each
profile has its own SQLite file and documents folder. Nothing is shared between them: no table, row or file of one
profile is ever read or written while the other is active.

- **Tauri layout** (`<root>` = app data dir, or `ARCHTRACKER_DATA_DIR`, AR-009):
  | Profile | Data dir | DB | Documents |
  |---|---|---|---|
  | `live` | `<root>` | `<root>/tracker.db` | `<root>/documents/` |
  | `demo` | `<root>/demo` | `<root>/demo/tracker.db` | `<root>/demo/documents/` |
  The live layout is unchanged from earlier versions, so existing installations keep their data.
- **Active profile:** stored in `<root>/profile.json` as `{"profile":"live"}` or `{"profile":"demo"}`. It is outside
  both databases. A missing, unreadable or invalid file means `live`. The profile is fixed for the lifetime of the
  process.
- **Rust side** (`src-tauri/src/lib.rs`). At setup, before any plugin opens a DB:
  1. resolve `<root>` and the active profile;
  2. if the profile is `demo` and `<root>/demo/.reset` exists, delete the whole `<root>/demo/` folder;
  3. create the profile's `documents/` dir;
  4. allow the fs plugin scope **only** on the active profile's `documents/` dir.
  Commands:
  - `get_data_dir` → the active profile's data dir;
  - `get_profile` → `"live" | "demo"`;
  - `switch_profile(profile)` → writes `profile.json`, then restarts the app (`AppHandle::restart`);
  - `reset_demo()` → only when the active profile is `demo` (otherwise returns an error and changes nothing): creates
    `<root>/demo/.reset`, then restarts the app.
  Deleting happens only at the next start, so no open DB file is ever deleted.
- **Browser mode:** the profile is `demo` when the start URL has the query `?profile=demo`, otherwise `live`. It is
  read once at startup. Each page load starts with a fresh in-memory DB.
  - Switching to demo: `location.assign("/?profile=demo")`. Switching to live: `location.assign("/")`.
  - Reset demo: `location.assign("/?profile=demo")`.
- **Container:** `RuntimeInfo` (`src/app/Container.ts`) gains:
  - `profile: "live" | "demo"`;
  - `switchProfile(profile): Promise<void>` (relaunch, per mode as above);
  - `resetDemo(): Promise<void>` (only meaningful in `demo`).
  The UI reads these from `src/app` (AR-002). `src/core/**` knows nothing about profiles. Both profiles use the same
  use cases, repositories and migrations.
- The pure helper `profileFromSearch(search: string): "live" | "demo"` (`src/app/profile.ts`) returns `demo` only
  when the URL query has `profile=demo` exactly, otherwise `live`. The browser mode uses it. In Tauri mode the
  frontend uses `get_profile` and never reads `profile.json` itself.
