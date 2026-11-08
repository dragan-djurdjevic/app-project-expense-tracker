# 03 — Data schema (SQLite)

## DS-001 General
- One SQLite file `tracker.db` in the Tauri app data directory (`appDataDir()`), e.g.
  `%APPDATA%\com.archtracker.app\tracker.db` on Windows.
- `PRAGMA foreign_keys = ON` on every connection.
- All business tables use `TEXT` UUID primary keys.
- Referential integrity is enforced by FKs with `ON DELETE RESTRICT` (rows are never hard-deleted).
- Uniqueness rules from `02-domain-model.md` are enforced **both** in use cases (to return proper errors) and by
  DB constraints (as a safety net).

## DS-002 Migrations
- Files in `src/adapters/sqlite/migrations/NNNN_<name>.sql`, applied in numeric order, each in a transaction.
- Applied versions recorded in `schema_migrations`.
- A released migration file is **never edited**; schema changes are new migration files.
- During the POC (before first release tag `v1.0.0`), the spec may state that `0001_init.sql` is regenerated;
  the current spec says: **all tables are created by `0001_init.sql`; later column changes are in the migrations
  listed from DS-006 on.**

## DS-003 `0001_init.sql` (normative)
```sql
CREATE TABLE schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE settings (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  currency         TEXT    NOT NULL DEFAULT 'EUR',
  default_vat_rate INTEGER NOT NULL DEFAULT 2000 CHECK (default_vat_rate BETWEEN 0 AND 10000)
);

CREATE TABLE investor (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  vat_number     TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email          TEXT,
  phone          TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  archived_at    TEXT
);

CREATE TABLE subcontractor (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  vat_number     TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email          TEXT,
  phone          TEXT,
  industry       TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  archived_at    TEXT
);

CREATE TABLE project (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  deadline    TEXT,
  status      TEXT NOT NULL DEFAULT 'PLANNED'
              CHECK (status IN ('PLANNED','ACTIVE','ON_HOLD','DONE','CANCELLED')),
  budget      INTEGER CHECK (budget IS NULL OR budget >= 0),
  investor_id TEXT NOT NULL REFERENCES investor(id) ON DELETE RESTRICT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX ix_project_investor ON project(investor_id);

CREATE TABLE contract (
  id               TEXT PRIMARY KEY,
  number           TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('INCOMING','OUTGOING')),
  project_id       TEXT NOT NULL REFERENCES project(id) ON DELETE RESTRICT,
  subcontractor_id TEXT REFERENCES subcontractor(id) ON DELETE RESTRICT,
  value            INTEGER NOT NULL CHECK (value >= 0),
  date             TEXT NOT NULL,
  description      TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  archived_at      TEXT,
  CHECK ((type = 'OUTGOING' AND subcontractor_id IS NOT NULL)
      OR (type = 'INCOMING' AND subcontractor_id IS NULL))
);
CREATE UNIQUE INDEX ux_contract_project_number ON contract(project_id, number COLLATE NOCASE);
CREATE INDEX ix_contract_project ON contract(project_id);
CREATE INDEX ix_contract_subcontractor ON contract(subcontractor_id);
CREATE INDEX ix_contract_date ON contract(date);

CREATE TABLE invoice (
  id              TEXT PRIMARY KEY,
  number          TEXT NOT NULL,
  contract_id     TEXT NOT NULL REFERENCES contract(id) ON DELETE RESTRICT,
  value           INTEGER NOT NULL CHECK (value >= 0),
  vat_rate        INTEGER NOT NULL CHECK (vat_rate BETWEEN 0 AND 10000),
  date            TEXT NOT NULL,
  due_date        TEXT,
  status          TEXT NOT NULL DEFAULT 'DRAFT'
                  CHECK (status IN ('DRAFT','ISSUED','PAID','CANCELLED')),
  description     TEXT,
  attachment_path TEXT,
  attachment_name TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  archived_at     TEXT,
  CHECK ((attachment_path IS NULL) = (attachment_name IS NULL))
);
CREATE UNIQUE INDEX ux_invoice_contract_number ON invoice(contract_id, number COLLATE NOCASE);
CREATE INDEX ix_invoice_contract ON invoice(contract_id);
CREATE INDEX ix_invoice_date ON invoice(date);

INSERT INTO settings (id) VALUES (1);
```

## DS-004 Document storage layout (Tauri mode)
- Root: `<appDataDir>/documents/`.
- Stored file name: `<invoiceId>/<uuid>.pdf` (relative path stored in `invoice.attachment_path`).
- Original file name stored in `invoice.attachment_name` (shown in UI, used as suggested name).
- Opening a document uses the OS default PDF viewer via `@tauri-apps/plugin-opener`.

## DS-005 Year extraction
Year of a date column = `CAST(substr(<col>, 1, 4) AS INTEGER)`. Analytics SQL must use this exact expression
(or an equivalent range predicate `<col> >= 'YYYY-01-01' AND <col> <= 'YYYY-12-31'`).

## DS-006 `0002_settings_language.sql` (normative)
```sql
ALTER TABLE settings ADD COLUMN language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','sr-Latn'));
```
After all migrations `schema_migrations` holds versions `1` and `2`.
