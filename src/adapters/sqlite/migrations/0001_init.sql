-- Spec: DS-002, DS-003
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
