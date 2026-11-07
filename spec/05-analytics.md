# 05 — Analytics

## AN-000 Common definitions
Let **Y** be the selected year, or *All* (no year restriction; offered on AN-1, AN-2, AN-4 only).

| Symbol | Definition |
|---|---|
| `contractedIn(p, Y)` | Σ `value` of **INCOMING** contracts of project p with `year(contract.date) = Y` |
| `collected(p, Y)` | Σ amount of **PAID** invoices on INCOMING contracts of p with `year(invoice.date) = Y` |
| `contractedOut(p, Y)` | Σ `value` of **OUTGOING** contracts of p with `year(contract.date) = Y` |
| `paidOut(p, Y)` | Σ amount of **PAID** invoices on OUTGOING contracts of p with `year(invoice.date) = Y` |
| amount (Net mode) | `invoice.value` |
| amount (Gross mode) | `invoice.value + round_half_up(invoice.value × vat_rate / 10000)` |

Rules:
- **AN-000a** Archived records (projects, contracts, invoices, investors, subcontractors) **are included** in all
  analytics. Archived projects are shown with an "Archived" badge.
- **AN-000b** CANCELLED, DRAFT and ISSUED invoices never count toward collected/paid.
- **AN-000c** Contract values are always net (no VAT on contracts). Percentages are always computed from **net**
  values, regardless of the Net/Gross toggle.
- **AN-000d** Percent = `round_half_up(numerator / denominator × 100, 1 decimal)`; denominator 0 → `"—"`.
- **AN-000e** Totals in footers are sums of the row values; footer percentages are computed from the footer totals
  (not averaged).
- **AN-000f** Rows are sorted by project name asc.
- **AN-000g** Contracted and collected are attributed by their **own** dates, so in a given year collected can
  exceed contracted (e.g. payment in 2026 of a contract signed in 2025). This is intended (cash-flow view).
- **AN-000h** `availableYears()` = distinct years of all `contract.date`, `invoice.date` and `project.deadline`
  values, descending. If empty → `[current year]`.

## AN-1 Contracted vs collected (per project)
Rows: every project p where `contractedIn(p,Y) > 0` **or** `collected(p,Y) > 0` (or there exists an INCOMING
contract dated in Y with value 0).
Columns: Project, Investor, Contracted, Collected, Collected %.
Footer: `Projects: <row count> (contracted in year: <count of rows with an INCOMING contract dated in Y>)`,
Σ Contracted, Σ Collected, footer %.

## AN-2 Subcontractor payments and company share (per project)
Answers two questions per project: *how much of the money contracted with subcontractors has been paid to them*,
and *of the money collected for the project, how much went to subcontractors and how much stayed with the company*.

Rows: every project p that is a row of AN-1 **or** has an OUTGOING contract dated in Y **or** `paidOut(p,Y) > 0`
(same row set as AN-4).
Columns:
| Column | Formula |
|---|---|
| Project | |
| Contracted to subcontractors | `contractedOut(p,Y)` |
| Paid to subcontractors | `paidOut(p,Y)` |
| Paid % of contracted | Paid ÷ Contracted to subcontractors |
| Collected from investor | `collected(p,Y)` |
| Subcontractor share % | Paid ÷ Collected |
| Retained by company | Collected − Paid (negative shown in red) |
| Retained % | Retained ÷ Collected |

Expandable row (only for projects with at least one OUTGOING contract or payment in Y): one sub-row per
subcontractor of that project, sorted by subcontractor name, showing Contracted, Paid, Paid % of contracted and
Subcontractor share % (that subcontractor's paid ÷ the project's collected). Retained columns are blank on sub-rows.
Footer (per-year summary): Σ of every column, with footer percentages computed from footer totals (AN-000e).

## AN-3 Projects per year
A project belongs to year Y if `year(project.deadline) = Y` **or** it has any contract (any type, incl. archived)
with `year(contract.date) = Y`. "All years" is not offered.
Columns: Project, Investor, Status, Deadline, Budget (null → "—"), Contracted in year (`contractedIn(p,Y)`).
Footer: `Projects: <count>`, Σ Budget (nulls ignored), Σ Contracted in year.
The same rule is used by the Year filter on the Projects list (UI-030).

## AN-4 Net result (per project)
Rows: union of AN-1 rows and AN-2 rows for Y.
Columns: Project, Collected (= `collected(p,Y)`), Paid to subcontractors (= `paidOut(p,Y)`),
Net (= Collected − Paid; negative shown in red), Net margin % (= Net / Collected, computed from net values).
Footer: Σ Collected, Σ Paid, Σ Net, footer margin %.

## AN-5 Budget realisation (per project, cumulative to date)
Compares each project's **budget** with what has actually been contracted, invoiced and collected from the investor.
There is no year filter; all dates count. Filter: project status (multi-select, default: all).
Net values only (budget and contracts are net); no Gross toggle.

Rows: all projects (incl. archived, per AN-000a), sorted by name.
| Column | Formula |
|---|---|
| Project, Investor, Status | |
| Budget | `project.budget` (null → "—") |
| Contracted | Σ INCOMING contract values (all dates) |
| Contracted % of budget | Contracted ÷ Budget |
| Invoiced | Σ ISSUED + PAID invoice values on INCOMING contracts (all dates) |
| Collected | Σ PAID invoice values on INCOMING contracts (all dates) |
| Realisation % of budget | Collected ÷ Budget — shown as a progress bar plus number; bar is red when > 100 % |
| Realisation % of contracted | Collected ÷ Contracted |
| Remaining budget | Budget − Collected (null budget → "—"; negative shown in red) |

Percent columns with a null or 0 budget → "—".
Footer: Σ Budget (non-null only), Σ Contracted, Σ Invoiced, Σ Collected, Σ Remaining budget (projects with a budget
only). Footer "% of budget" percentages use only projects with a non-null budget in **both** numerator and
denominator; "Realisation % of contracted" uses all rows.

---

## AN-900 Worked example (normative fixture `tests/fixtures/analytics.ts`, name `"analytics"`)
All amounts below in EUR (minor units in the fixture = amount × 100). All invoices have `vat_rate = 2000` (20 %).

**Investors:** I1 "Alpha Invest" (VAT `ALPHA001`), I2 "Beta Holding" (VAT `BETA001`).
**Subcontractors:** S1 "Struct Eng" (VAT `STRUCT01`, industry "Structural"), S2 "HVAC Pro" (VAT `HVAC01`, industry "HVAC").

**Projects:**
| Key | Name | Investor | Deadline | Status | Budget | Archived |
|---|---|---|---|---|---|---|
| P1 | Villa Lake | I1 | 2025-06-30 | DONE | 120,000.00 | no |
| P2 | Office Tower | I2 | 2026-12-31 | ACTIVE | 600,000.00 | no |
| P3 | School Annex | I1 | 2026-03-31 | ACTIVE | 35,000.00 | **yes** |
| P4 | Library | I2 | 2027-05-01 | PLANNED | — | no |

**Contracts:**
| Key | Number | Project | Type | Subcontractor | Value | Date |
|---|---|---|---|---|---|---|
| C1 | IN-001 | P1 | INCOMING | — | 100,000.00 | 2025-01-15 |
| C2 | OUT-001 | P1 | OUTGOING | S1 | 20,000.00 | 2025-02-01 |
| C3 | IN-002 | P2 | INCOMING | — | 500,000.00 | 2025-11-10 |
| C4 | IN-003 | P2 | INCOMING | — | 50,000.00 | 2026-02-01 |
| C5 | OUT-002 | P2 | OUTGOING | S1 | 80,000.00 | 2026-01-10 |
| C6 | OUT-003 | P2 | OUTGOING | S2 | 40,000.00 | 2026-03-01 |
| C7 | IN-004 | P3 | INCOMING | — | 30,000.00 | 2026-01-20 |

**Invoices:**
| Key | Number | Contract | Net | Date | Status |
|---|---|---|---|---|---|
| V1 | INV-01 | C1 | 40,000.00 | 2025-03-01 | PAID |
| V2 | INV-02 | C1 | 60,000.00 | 2025-12-15 | PAID |
| V3 | INV-03 | C2 | 20,000.00 | 2025-04-01 | PAID |
| V4 | INV-04 | C3 | 100,000.00 | 2025-12-01 | PAID |
| V5 | INV-05 | C3 | 150,000.00 | 2026-02-15 | PAID |
| V6 | INV-06 | C3 | 100,000.00 | 2026-05-01 | ISSUED |
| V7 | INV-07 | C4 | 25,000.00 | 2026-03-10 | CANCELLED |
| V8 | INV-08 | C5 | 30,000.00 | 2026-02-20 | PAID |
| V9 | INV-09 | C5 | 20,000.00 | 2026-04-01 | DRAFT |
| V10 | INV-10 | C6 | 10,000.00 | 2026-03-15 | PAID |
| V11 | INV-11 | C7 | 15,000.00 | 2026-02-28 | PAID |
| V12 | INV-12 | C1 | 5,000.00 | 2026-01-10 | PAID |

**availableYears()** = `[2027, 2026, 2025]`.

### AN-901 Expected AN-1
| Y | Project | Contracted | Collected | % |
|---|---|---|---|---|
| 2025 | Office Tower | 500,000.00 | 100,000.00 | 20.0 % |
| 2025 | Villa Lake | 100,000.00 | 100,000.00 | 100.0 % |
| **2025 footer** | Projects: 2 (contracted in year: 2) | **600,000.00** | **200,000.00** | **33.3 %** |
| 2026 | Office Tower | 50,000.00 | 150,000.00 | 300.0 % |
| 2026 | School Annex (Archived) | 30,000.00 | 15,000.00 | 50.0 % |
| 2026 | Villa Lake | 0.00 | 5,000.00 | — |
| **2026 footer** | Projects: 3 (contracted in year: 2) | **80,000.00** | **170,000.00** | **212.5 %** |
| All | Office Tower | 550,000.00 | 250,000.00 | 45.5 % |
| All | School Annex | 30,000.00 | 15,000.00 | 50.0 % |
| All | Villa Lake | 100,000.00 | 105,000.00 | 105.0 % |
| **All footer** | Projects: 3 (contracted in year: 3) | **680,000.00** | **370,000.00** | **54.4 %** |
| 2027 | *(no rows)* | 0.00 | 0.00 | — |

Gross mode, 2025: Collected Office Tower 120,000.00, Villa Lake 120,000.00, footer 240,000.00; percentages unchanged.

### AN-902 Expected AN-2
| Y | Project / Subcontractor | Contracted out | Paid | Paid % of contr. | Collected | Sub. share % | Retained | Retained % |
|---|---|---|---|---|---|---|---|---|
| 2025 | Office Tower | 0.00 | 0.00 | — | 100,000.00 | 0.0 % | 100,000.00 | 100.0 % |
| 2025 | Villa Lake | 20,000.00 | 20,000.00 | 100.0 % | 100,000.00 | 20.0 % | 80,000.00 | 80.0 % |
| 2025 | ↳ Struct Eng | 20,000.00 | 20,000.00 | 100.0 % | | 20.0 % | | |
| **2025 footer** | | **20,000.00** | **20,000.00** | **100.0 %** | **200,000.00** | **10.0 %** | **180,000.00** | **90.0 %** |
| 2026 | Office Tower | 120,000.00 | 40,000.00 | 33.3 % | 150,000.00 | 26.7 % | 110,000.00 | 73.3 % |
| 2026 | ↳ HVAC Pro | 40,000.00 | 10,000.00 | 25.0 % | | 6.7 % | | |
| 2026 | ↳ Struct Eng | 80,000.00 | 30,000.00 | 37.5 % | | 20.0 % | | |
| 2026 | School Annex | 0.00 | 0.00 | — | 15,000.00 | 0.0 % | 15,000.00 | 100.0 % |
| 2026 | Villa Lake | 0.00 | 0.00 | — | 5,000.00 | 0.0 % | 5,000.00 | 100.0 % |
| **2026 footer** | | **120,000.00** | **40,000.00** | **33.3 %** | **170,000.00** | **23.5 %** | **130,000.00** | **76.5 %** |

Office Tower 2025, School Annex 2026 and Villa Lake 2026 have no expandable sub-rows.

### AN-903 Expected AN-3
| Y | Projects | Footer |
|---|---|---|
| 2025 | Office Tower (contracted in year 500,000.00), Villa Lake (100,000.00) | Projects: 2, Budget 720,000.00, Contracted 600,000.00 |
| 2026 | Office Tower (50,000.00), School Annex (30,000.00) | Projects: 2, Budget 635,000.00, Contracted 80,000.00 |
| 2027 | Library (0.00, budget "—") | Projects: 1, Budget 0.00, Contracted 0.00 |

### AN-904 Expected AN-4
| Y | Project | Collected | Paid | Net | Margin |
|---|---|---|---|---|---|
| 2025 | Office Tower | 100,000.00 | 0.00 | 100,000.00 | 100.0 % |
| 2025 | Villa Lake | 100,000.00 | 20,000.00 | 80,000.00 | 80.0 % |
| **2025 footer** | | **200,000.00** | **20,000.00** | **180,000.00** | **90.0 %** |
| 2026 | Office Tower | 150,000.00 | 40,000.00 | 110,000.00 | 73.3 % |
| 2026 | School Annex | 15,000.00 | 0.00 | 15,000.00 | 100.0 % |
| 2026 | Villa Lake | 5,000.00 | 0.00 | 5,000.00 | 100.0 % |
| **2026 footer** | | **170,000.00** | **40,000.00** | **130,000.00** | **76.5 %** |

Gross mode 2026 footer: Collected 204,000.00, Paid 48,000.00, Net 156,000.00, Margin 76.5 %.

### AN-905 Expected AN-5 (all statuses)
| Project | Budget | Contracted | Contr. % budget | Invoiced | Collected | Real. % budget | Real. % contracted | Remaining |
|---|---|---|---|---|---|---|---|---|
| Library | — | 0.00 | — | 0.00 | 0.00 | — | — | — |
| Office Tower | 600,000.00 | 550,000.00 | 91.7 % | 350,000.00 | 250,000.00 | 41.7 % | 45.5 % | 350,000.00 |
| School Annex (Archived) | 35,000.00 | 30,000.00 | 85.7 % | 15,000.00 | 15,000.00 | 42.9 % | 50.0 % | 20,000.00 |
| Villa Lake | 120,000.00 | 100,000.00 | 83.3 % | 105,000.00 | 105,000.00 | 87.5 % | 105.0 % | 15,000.00 |
| **Footer** | **755,000.00** | **680,000.00** | **90.1 %** | **470,000.00** | **370,000.00** | **49.0 %** | **54.4 %** | **385,000.00** |

Notes: Office Tower Invoiced = V4 + V5 (PAID) + V6 (ISSUED); V7 (CANCELLED) excluded. Footer "Contr. % budget" =
680,000 ÷ 755,000 (Library has no budget and contracted 0). With status filter `ACTIVE` only: rows Office Tower and
School Annex; footer Budget 635,000.00, Collected 265,000.00, Real. % budget 41.7 %.
