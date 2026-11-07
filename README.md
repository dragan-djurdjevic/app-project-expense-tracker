# Architecture Project Tracker (POC)

Desktop app (Tauri 2 + React + TypeScript + SQLite) for tracking architecture projects, investors,
subcontractors, contracts, invoices (with PDF) and analytics.

**This repository is spec-driven.** `spec/` is the source of truth; code is generated from it milestone by milestone.
Read [`CLAUDE.md`](CLAUDE.md) for the agent rules.

- Spec: [`spec/`](spec/) — start with [`00-overview.md`](spec/00-overview.md)
- Milestones and test cases: [`spec/milestones/`](spec/milestones/README.md)
- Validation reports: `validation/`
- Spec/code sync state: [`spec-lock.json`](spec-lock.json)

## Workflow (Claude Code)
- `/milestone M1` … `/milestone M5` — implement + validate the next milestone.
- Change the spec → bump `spec/VERSION`, add a `spec/CHANGELOG.md` entry, commit → `/spec-sync`.

Build and run instructions are added in M1.
