# 06 — Demo mode

Demo mode runs the same app on a **separate** database and documents folder (profile `demo`, AR-013), preloaded
with sample data that exercises every screen and every analytics state. Live data is never read or written while
demo mode is active, and vice versa.

## DEMO-001 Seeding mechanism
- `src/app/demo/seedDemoData.ts` exports `seedDemoData(useCases, clock, loadPdf)`. It creates every record of
  DEMO-003 **only through the core use cases** of the container (`createInvestor`, `createSubcontractor`,
  `createProject`, `createContract`, `createInvoice`, `changeInvoiceStatus`, `attachInvoiceDocument`,
  `archive*`). It never uses `SqlDriver`, SQL or adapters directly, so every record passes the business rules and
  the seed works unchanged with any future persistence adapter (AR-003).
- Any use case returning `ok: false` during seeding is a programming error: the seed throws, and startup shows the
  AR-010 full-screen error.
- Order:
  1. investors, subcontractors, projects, contracts, invoices (in DEMO-003 table order);
  2. status changes: invoices with status `PAID` are created as `ISSUED`, then changed to `PAID`;
  3. attachments (DEMO-004);
  4. archiving: invoice V32, contract C19, project P6, investor I4, subcontractor S5.
  Archiving last is required by BR-GEN-006.
- Idempotent: the seed does nothing if `listInvestors` or `listProjects` (with archived included) returns any row.
- The demo seed never runs in the `live` profile (AR-010).

## DEMO-002 Relative dates
- `Y0` = the year of the local calendar date of `Clock.now()` ("today"). Dataset dates are written as
  `Y0-MM-DD`, `Y-<n>-MM-DD` or `Y+<n>-MM-DD` (e.g. `Y-1-09-15` = 15 September of last year, `Y+1-03-31` =
  31 March of next year) and resolved at seed time.
- A resolved date with offset `0` that is later than today is **clamped to today**. Other offsets are never
  clamped (deadlines may lie in the future).
- Every invoice `dueDate` = its resolved `date` + 30 calendar days.
- Consequences (normative, tested): all dates with offset 0 lie in `[Y0-01-01, today]`, so years never shift and
  the DEMO-900 values hold for any "today" in Y0. Invoices V19 and V39 are ISSUED with a due date in Y-1, so they
  are overdue on every start date.
- Timestamps (`createdAt`, `updatedAt`, `archivedAt`) are whatever the `Clock` returns while seeding.

## DEMO-003 Dataset (normative)
Currency: settings default (EUR). Amounts are net, in currency units (minor units = amount × 100).
VAT rate is 20 % (2000 bp) unless stated otherwise.

**Investors**
| Key | Name | VAT number | Contact person | Email | Phone | Archived |
|---|---|---|---|---|---|---|
| I1 | Northwind Developments | NWD-1001 | Emma Clarke | emma.clarke@northwind.example | +44 20 7946 0101 | no |
| I2 | Harbor City Council | HCC-2002 | Daniel Moore | d.moore@harborcity.example | +44 20 7946 0202 | no |
| I3 | Greenleaf Properties | GLP-3003 | Sophie Turner | sophie@greenleaf.example | +44 20 7946 0303 | no |
| I4 | Summit Retail Group | SRG-4004 | James Walker | — | — | **yes** |

**Subcontractors**
| Key | Name | VAT number | Industry | Contact person | Email | Archived |
|---|---|---|---|---|---|---|
| S1 | Atlas Structural Engineering | ATL-5001 | Structural engineering | Oliver Hughes | office@atlas-eng.example | no |
| S2 | BlueAir HVAC Systems | BAH-5002 | HVAC | Grace Bennett | info@blueair.example | no |
| S3 | Brightline Electrical | BLE-5003 | Electrical | Henry Price | — | no |
| S4 | Terra Landscaping | TLS-5004 | Landscaping | Lucy Ward | lucy@terra.example | no |
| S5 | Quartz Interiors | QIN-5005 | Interior fit-out | — | — | **yes** |

**Projects**
| Key | Name | Investor | Status | Budget | Deadline | Archived |
|---|---|---|---|---|---|---|
| P1 | Riverside Apartments | I1 | ACTIVE | 850,000.00 | Y+1-03-31 | no |
| P2 | Harbor Library Renovation | I2 | DONE | 300,000.00 | Y-1-10-31 | no |
| P3 | Greenleaf Office Park | I3 | ACTIVE | 1,200,000.00 | Y+2-06-30 | no |
| P4 | City Sports Hall | I2 | ON_HOLD | 540,000.00 | Y+1-09-30 | no |
| P5 | Lakeside Villa | I1 | DONE | — | Y-2-12-15 | no |
| P6 | Summit Mall Extension | I4 | CANCELLED | 900,000.00 | Y-1-06-30 | **yes** |
| P7 | Greenleaf Kindergarten | I3 | PLANNED | 260,000.00 | Y+1-12-31 | no |
| P8 | Old Town Facade Restoration | I2 | DONE | 150,000.00 | Y-2-09-30 | no |

**Contracts** (OUTGOING = with the subcontractor shown)
| Key | Number | Project | Type | Subcontractor | Value | Date | Description | Archived |
|---|---|---|---|---|---|---|---|---|
| C01 | LV-IN-01 | P5 | INCOMING | — | 180,000.00 | Y-2-02-10 | Architectural design and site supervision | no |
| C02 | LV-OUT-01 | P5 | OUTGOING | S1 | 30,000.00 | Y-2-03-01 | Structural design | no |
| C03 | LV-OUT-02 | P5 | OUTGOING | S4 | 12,000.00 | Y-2-05-15 | Garden and terrace landscaping | no |
| C04 | OT-IN-01 | P8 | INCOMING | — | 140,000.00 | Y-2-04-20 | Facade restoration design | no |
| C05 | OT-OUT-01 | P8 | OUTGOING | S1 | 25,000.00 | Y-2-05-05 | Structural survey | no |
| C06 | HL-IN-01 | P2 | INCOMING | — | 280,000.00 | Y-1-01-20 | Renovation design and supervision | no |
| C07 | HL-IN-02 | P2 | INCOMING | — | 50,000.00 | Y-1-07-01 | Addendum: reading room extension | no |
| C08 | HL-OUT-01 | P2 | OUTGOING | S2 | 45,000.00 | Y-1-02-15 | HVAC design | no |
| C09 | HL-OUT-02 | P2 | OUTGOING | S3 | 30,000.00 | Y-1-03-10 | Electrical design | no |
| C10 | RA-IN-01 | P1 | INCOMING | — | 600,000.00 | Y-1-09-15 | Main design contract | no |
| C11 | RA-IN-02 | P1 | INCOMING | — | 150,000.00 | Y0-03-01 | Interior design package | no |
| C12 | RA-OUT-01 | P1 | OUTGOING | S1 | 90,000.00 | Y-1-10-01 | Structural engineering | no |
| C13 | RA-OUT-02 | P1 | OUTGOING | S3 | 60,000.00 | Y0-02-10 | Electrical installations design | no |
| C14 | RA-OUT-03 | P1 | OUTGOING | S5 | 40,000.00 | Y0-01-20 | Show apartment fit-out | no |
| C15 | GO-IN-01 | P3 | INCOMING | — | 950,000.00 | Y0-01-15 | Office park master plan and design | no |
| C16 | GO-OUT-01 | P3 | OUTGOING | S1 | 120,000.00 | Y0-02-01 | Structural engineering | no |
| C17 | GO-OUT-02 | P3 | OUTGOING | S2 | 85,000.00 | Y0-04-10 | HVAC design | no |
| C18 | SH-IN-01 | P4 | INCOMING | — | 400,000.00 | Y-1-05-10 | Sports hall design | no |
| C19 | SH-OUT-01 | P4 | OUTGOING | S4 | 20,000.00 | Y-1-06-01 | Outdoor areas (terminated) | **yes** |
| C20 | SM-IN-01 | P6 | INCOMING | — | 200,000.00 | Y-2-10-01 | Mall extension concept design | no |

**Invoices** (`dueDate` = date + 30 days, DEMO-002)
| Key | Number | Contract | Net | VAT | Date | Status | Archived |
|---|---|---|---|---|---|---|---|
| V01 | LV-2401 | C01 | 60,000.00 | 20 % | Y-2-03-01 | PAID | no |
| V02 | LV-2402 | C01 | 70,000.00 | 20 % | Y-2-07-01 | PAID | no |
| V03 | LV-2403 | C01 | 50,000.00 | 20 % | Y-2-11-15 | PAID | no |
| V04 | LV-S-01 | C02 | 30,000.00 | 20 % | Y-2-06-01 | PAID | no |
| V05 | LV-S-02 | C03 | 12,000.00 | 10 % | Y-2-08-01 | PAID | no |
| V06 | OT-2401 | C04 | 70,000.00 | 20 % | Y-2-06-15 | PAID | no |
| V07 | OT-2402 | C04 | 70,000.00 | 20 % | Y-1-01-20 | PAID | no |
| V08 | OT-S-01 | C05 | 25,000.00 | 20 % | Y-2-08-20 | PAID | no |
| V09 | SM-2401 | C20 | 40,000.00 | 20 % | Y-2-11-01 | PAID | no |
| V10 | SM-2402 | C20 | 60,000.00 | 20 % | Y-1-02-01 | CANCELLED | no |
| V11 | HL-2501 | C06 | 100,000.00 | 20 % | Y-1-03-01 | PAID | no |
| V12 | HL-2502 | C06 | 100,000.00 | 20 % | Y-1-06-01 | PAID | no |
| V13 | HL-2503 | C06 | 80,000.00 | 20 % | Y-1-09-01 | PAID | no |
| V14 | HL-2504 | C07 | 50,000.00 | 20 % | Y-1-10-15 | PAID | no |
| V15 | HL-S-01 | C08 | 45,000.00 | 20 % | Y-1-04-01 | PAID | no |
| V16 | HL-S-02 | C09 | 20,000.00 | 20 % | Y-1-05-01 | PAID | no |
| V17 | HL-S-03 | C09 | 15,000.00 | 20 % | Y-1-08-01 | PAID | no |
| V18 | SH-2501 | C18 | 120,000.00 | 20 % | Y-1-06-15 | PAID | no |
| V19 | SH-2502 | C18 | 80,000.00 | 20 % | Y-1-11-20 | ISSUED | no |
| V20 | SH-S-01 | C19 | 10,000.00 | 20 % | Y-1-07-01 | CANCELLED | no |
| V21 | SH-S-02 | C19 | 5,000.00 | 20 % | Y-1-08-01 | PAID | no |
| V22 | RA-2501 | C10 | 150,000.00 | 20 % | Y-1-10-15 | PAID | no |
| V23 | RA-2502 | C10 | 200,000.00 | 20 % | Y0-02-01 | PAID | no |
| V24 | RA-2503 | C10 | 100,000.00 | 20 % | Y0-05-01 | ISSUED | no |
| V25 | RA-2601 | C11 | 50,000.00 | 20 % | Y0-04-01 | PAID | no |
| V26 | RA-2602 | C11 | 40,000.00 | 20 % | Y0-06-01 | DRAFT | no |
| V27 | RA-S-01 | C12 | 45,000.00 | 20 % | Y-1-12-01 | PAID | no |
| V28 | RA-S-02 | C12 | 30,000.00 | 20 % | Y0-03-15 | PAID | no |
| V29 | RA-S-03 | C13 | 25,000.00 | 20 % | Y0-04-20 | PAID | no |
| V30 | RA-S-04 | C14 | 20,000.00 | 10 % | Y0-03-01 | PAID | no |
| V31 | RA-S-05 | C14 | 20,000.00 | 10 % | Y0-05-10 | ISSUED | no |
| V32 | RA-2504 | C10 | 15,000.00 | 20 % | Y0-01-10 | CANCELLED | **yes** |
| V33 | GO-2601 | C15 | 200,000.00 | 20 % | Y0-02-01 | PAID | no |
| V34 | GO-2602 | C15 | 150,000.00 | 20 % | Y0-04-01 | PAID | no |
| V35 | GO-2603 | C15 | 150,000.00 | 20 % | Y0-06-01 | ISSUED | no |
| V36 | GO-S-01 | C16 | 40,000.00 | 20 % | Y0-03-01 | PAID | no |
| V37 | GO-S-02 | C16 | 30,000.00 | 20 % | Y0-05-01 | ISSUED | no |
| V38 | GO-S-03 | C17 | 25,000.00 | 0 % | Y0-05-20 | DRAFT | no |
| V39 | SH-2503 | C18 | 40,000.00 | 20 % | Y-1-11-25 | ISSUED | no |

Totals: 4 investors, 5 subcontractors, 8 projects, 20 contracts, 39 invoices (28 PAID, 6 ISSUED, 2 DRAFT, 3 CANCELLED).

**Coverage the dataset guarantees** (asserted by tests):
- every ProjectStatus and InvoiceStatus occurs;
- each entity type has exactly one archived record;
- an archived subcontractor (S5) and an archived investor (I4) are still referenced;
- an over-budget project (P2: Realisation 110.0 %, red bar, negative remaining budget);
- a project without a budget (P5);
- a project without contracts (P7);
- an over-invoiced contract (C09: 35,000 > 30,000, BR-IVC-008 warning on V17);
- collected exceeds contracted in a year (P1 in Y0, AN-000g);
- an AN-2 sub-row with contracted 0 and paid > 0 (S1 on P1 in Y0);
- VAT rates of 20 %, 10 % and 0 %;
- ≥ 2 overdue invoices (V19, V39);
- 5 available years (`Y+2 … Y-2`).

## DEMO-004 Demo documents
- Two PDFs are bundled in `src/app/demo/assets/`: `demo-invoice-a.pdf` and `demo-invoice-b.pdf`. Each is ASCII
  only, starts with `%PDF-`, is ≤ 10 kB and shows the text "SAMPLE INVOICE — DEMO DATA".
- Attachments are made through `attachInvoiceDocument`, with the original name equal to the invoice number:
  | Invoice | File | Original name |
  |---|---|---|
  | V01 | demo-invoice-a.pdf | LV-2401.pdf |
  | V11 | demo-invoice-b.pdf | HL-2501.pdf |
  | V33 | demo-invoice-a.pdf | GO-2601.pdf |
- The PDFs are loaded by the app layer (Vite `?url` import + `fetch`), never from `tests/`.

## DEMO-900 Expected analytics (normative)
These hold for any "today" in Y0 (DEMO-002). The table writes years for `Y0 = 2026` (Y-2 = 2024, Y-1 = 2025,
Y+1 = 2027, Y+2 = 2028). Amounts are EUR in Net mode unless stated otherwise.

**availableYears()** = `[2028, 2027, 2026, 2025, 2024]`.

### DEMO-901 Expected AN-1
| Y | Project | Contracted | Collected | % |
|---|---|---|---|---|
| 2026 | Greenleaf Office Park | 950,000.00 | 350,000.00 | 36.8 % |
| 2026 | Riverside Apartments | 150,000.00 | 250,000.00 | 166.7 % |
| **2026 footer** | Projects: 2 (contracted in year: 2) | **1,100,000.00** | **600,000.00** | **54.5 %** |
| **2025 footer** | Projects: 4 (contracted in year: 3) | **1,330,000.00** | **670,000.00** | **50.4 %** |
| **2024 footer** | Projects: 3 (contracted in year: 3) | **520,000.00** | **290,000.00** | **55.8 %** |
| All | City Sports Hall | 400,000.00 | 120,000.00 | 30.0 % |
| All | Greenleaf Office Park | 950,000.00 | 350,000.00 | 36.8 % |
| All | Harbor Library Renovation | 330,000.00 | 330,000.00 | 100.0 % |
| All | Lakeside Villa | 180,000.00 | 180,000.00 | 100.0 % |
| All | Old Town Facade Restoration | 140,000.00 | 140,000.00 | 100.0 % |
| All | Riverside Apartments | 750,000.00 | 400,000.00 | 53.3 % |
| All | Summit Mall Extension (Archived) | 200,000.00 | 40,000.00 | 20.0 % |
| **All footer** | Projects: 7 (contracted in year: 7) | **2,950,000.00** | **1,560,000.00** | **52.9 %** |

The 2025 rows are City Sports Hall, Harbor Library Renovation, Old Town Facade Restoration (contracted 0.00, collected
70,000.00, "—") and Riverside Apartments. Gross mode, 2026 footer: Collected 720,000.00, percentage unchanged.

### DEMO-902 Expected AN-2 (2026)
| Project / Subcontractor | Contracted out | Paid | Paid % of contr. | Collected | Sub. share % | Retained | Retained % |
|---|---|---|---|---|---|---|---|
| Greenleaf Office Park | 205,000.00 | 40,000.00 | 19.5 % | 350,000.00 | 11.4 % | 310,000.00 | 88.6 % |
| ↳ Atlas Structural Engineering | 120,000.00 | 40,000.00 | 33.3 % | | 11.4 % | | |
| ↳ BlueAir HVAC Systems | 85,000.00 | 0.00 | 0.0 % | | 0.0 % | | |
| Riverside Apartments | 100,000.00 | 75,000.00 | 75.0 % | 250,000.00 | 30.0 % | 175,000.00 | 70.0 % |
| ↳ Atlas Structural Engineering | 0.00 | 30,000.00 | — | | 12.0 % | | |
| ↳ Brightline Electrical | 60,000.00 | 25,000.00 | 41.7 % | | 10.0 % | | |
| ↳ Quartz Interiors | 40,000.00 | 20,000.00 | 50.0 % | | 8.0 % | | |
| **Footer** | **305,000.00** | **115,000.00** | **37.7 %** | **600,000.00** | **19.2 %** | **485,000.00** | **80.8 %** |

Footer for 2025: Contracted out 185,000.00, Paid 130,000.00 (70.3 %), Collected 670,000.00, share 19.4 %,
Retained 540,000.00 (80.6 %). In 2025, Harbor Library Renovation has Paid 80,000.00 of 75,000.00 contracted
(106.7 %). All footer: 557,000.00 / 312,000.00 (56.0 %) / 1,560,000.00 / 20.0 % / 1,248,000.00 (80.0 %).

### DEMO-903 Expected AN-3
| Y | Projects (contracted in year) | Footer |
|---|---|---|
| 2026 | Greenleaf Office Park (950,000.00), Riverside Apartments (150,000.00) | Projects: 2, Budget 2,050,000.00, Contracted 1,100,000.00 |
| 2025 | City Sports Hall (400,000.00), Harbor Library Renovation (330,000.00), Riverside Apartments (600,000.00), Summit Mall Extension (0.00) | Projects: 4, Budget 2,590,000.00, Contracted 1,330,000.00 |
| 2027 | City Sports Hall, Greenleaf Kindergarten, Riverside Apartments (all 0.00) | Projects: 3, Budget 1,650,000.00, Contracted 0.00 |

### DEMO-904 Expected AN-4
| Y | Project | Collected | Paid | Net | Margin |
|---|---|---|---|---|---|
| 2026 | Greenleaf Office Park | 350,000.00 | 40,000.00 | 310,000.00 | 88.6 % |
| 2026 | Riverside Apartments | 250,000.00 | 75,000.00 | 175,000.00 | 70.0 % |
| **2026 footer** | | **600,000.00** | **115,000.00** | **485,000.00** | **80.8 %** |
| **All footer** | | **1,560,000.00** | **312,000.00** | **1,248,000.00** | **80.0 %** |

Gross mode 2026 footer: Collected 720,000.00, Paid 136,000.00, Net 584,000.00, Margin 80.8 % (percentages from net values, AN-000c).

### DEMO-905 Expected AN-5 (all statuses)
| Project | Budget | Contracted | Contr. % budget | Invoiced | Collected | Real. % budget | Real. % contracted | Remaining |
|---|---|---|---|---|---|---|---|---|
| City Sports Hall | 540,000.00 | 400,000.00 | 74.1 % | 240,000.00 | 120,000.00 | 22.2 % | 30.0 % | 420,000.00 |
| Greenleaf Kindergarten | 260,000.00 | 0.00 | 0.0 % | 0.00 | 0.00 | 0.0 % | — | 260,000.00 |
| Greenleaf Office Park | 1,200,000.00 | 950,000.00 | 79.2 % | 500,000.00 | 350,000.00 | 29.2 % | 36.8 % | 850,000.00 |
| Harbor Library Renovation | 300,000.00 | 330,000.00 | 110.0 % | 330,000.00 | 330,000.00 | 110.0 % (red) | 100.0 % | −30,000.00 (red) |
| Lakeside Villa | — | 180,000.00 | — | 180,000.00 | 180,000.00 | — | 100.0 % | — |
| Old Town Facade Restoration | 150,000.00 | 140,000.00 | 93.3 % | 140,000.00 | 140,000.00 | 93.3 % | 100.0 % | 10,000.00 |
| Riverside Apartments | 850,000.00 | 750,000.00 | 88.2 % | 500,000.00 | 400,000.00 | 47.1 % | 53.3 % | 450,000.00 |
| Summit Mall Extension (Archived) | 900,000.00 | 200,000.00 | 22.2 % | 40,000.00 | 40,000.00 | 4.4 % | 20.0 % | 860,000.00 |
| **Footer** | **4,200,000.00** | **2,950,000.00** | **66.0 %** | **1,930,000.00** | **1,560,000.00** | **32.9 %** | **52.9 %** | **2,820,000.00** |

Footer "% of budget" percentages exclude Lakeside Villa (no budget) per AN-5.

### DEMO-906 Expected overdue invoices
With "today" = 2026-06-15: V19, V24, V31, V37 and V39 are overdue (ISSUED, due date < today).
With "today" = 2026-01-03: exactly V19 and V39.
