# 00 — Overview

## OV-001 Vision
A desktop application for an architecture company to track its **projects**, the **investors** (clients) who pay
for them, the **subcontractors** to whom parts of the work are delegated, the **contracts** with both, and the
**invoices** issued against those contracts (with an attached PDF). On top of this data the app provides
**analytics** on contracted vs. collected money, subcontractor payments and net result per project and year.

## OV-002 Nature of this deliverable
This is a **proof of concept (POC)**. It is used for a demo and review; the spec is then adjusted and the code
regenerated. The spec is the single source of truth (see `CLAUDE.md`).

## OV-003 Target platforms
- Phase 1: **Windows 10/11 x64** (installer: NSIS `.exe`).
- Later: macOS (same codebase; not validated in this POC).

## OV-004 Users
A single user per computer. No login, no roles, no multi-user concurrency.

## OV-005 In scope
- CRUD for investors, subcontractors, projects, contracts, invoices.
- Soft delete (archive) for all entities.
- PDF attachment per invoice (attach, open, replace, remove).
- Analytics views AN-1 … AN-4 (see `05-analytics.md`), filterable by year.
- English UI, prepared for translation (i18n).
- Local SQLite database stored in the OS app-data directory.

## OV-006 Out of scope
- Authentication / authorisation.
- Multi-user, sync, central database, backend API (architecture must allow it later — see `01-architecture.md`).
- Multi-currency and exchange rates.
- Partial payments / payment records (an invoice is either PAID or not).
- Printing, export to Excel/PDF, e-mail.
- Backup/restore UI (user can copy the app-data folder manually).
- macOS installer.
- Hard delete of records.

## OV-007 Glossary
| Term | Meaning |
|---|---|
| Investor | Client that commissions and pays for a project. |
| Subcontractor | Company to which part of a project is delegated and paid for. |
| INCOMING contract | Contract with the project's investor — money flows **in** to the company. |
| OUTGOING contract | Contract with a subcontractor — money flows **out** of the company. |
| Net amount | Amount excluding VAT. All stored amounts are net. |
| Gross amount | Net amount + VAT. Always derived, never stored. |
| Collected | Sum of PAID invoices on INCOMING contracts. |
| Paid (to subcontractors) | Sum of PAID invoices on OUTGOING contracts. |
| Archived | Soft-deleted: hidden from lists by default, kept for history and analytics. |
| Minor units | Integer amount in the smallest currency unit (e.g. cents). 1 234,56 → `123456`. |
