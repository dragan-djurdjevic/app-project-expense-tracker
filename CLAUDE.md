# Agent rules — Architecture Project Tracker

This repository is **spec-driven**. `spec/` is the single source of truth. Code exists only to implement the spec.
These rules apply to every agent and every session, including the main session.

## R1 — The spec is the source of truth
- Read `spec/00-overview.md` … `spec/05-analytics.md` and the relevant `spec/milestones/Mx.md` before changing code.
- Never add behaviour, screens, fields, dependencies or "improvements" the spec does not ask for.
- If the user asks for a behaviour change, **change the spec first** (with a `spec/CHANGELOG.md` entry and a
  `spec/VERSION` bump), commit it, then implement. Never implement a requested change only in code.

## R2 — No spec change ⇒ no code change
- Code state is recorded in `spec-lock.json` (`specCommit` = spec commit the code was last validated against,
  plus the status of each milestone).
- Before implementing, compute the scope:
  `git diff <specCommit> HEAD -- spec/` (if `specCommit` is null, the scope is the full spec of the target milestone).
- Spec changes must be **committed** before implementation starts. Uncommitted changes under `spec/` → stop and ask.
- Implementing a milestone whose status is `pending` is in scope by definition. For milestones already `done`,
  only code affected by the spec diff may change.
- If the diff is empty and the target milestone is `done` → make **no** code change and report "Spec unchanged — nothing to do".
- Bugs found by validation may be fixed only within the spec IDs that are in scope.

## R3 — Traceability
- Every spec item has a stable ID (`OV-`, `AR-`, `DM-`, `BR-`, `DS-`, `UI-`, `AN-`, `TC-`). IDs are never
  renumbered or reused; removed items are struck through and marked `REMOVED in <version>`.
- Each source file starts with `// Spec: <ID>, <ID>, …` listing what it implements (SQL files: `-- Spec: …`).
- Each automated test title starts with its TC ID. `npm run spec:trace -- Mx` must pass.
- When the spec diff changes an ID, update every file whose `Spec:` header lists that ID, plus their tests.

## R4 — Determinism
- Follow `spec/01-architecture.md` exactly: folder layout, naming, stack, versions, scripts.
- Dependencies: only those in AR-006; exact versions are pinned by the committed lockfiles. Never run
  `npm update` or bump versions unless the spec says so.
- Run `prettier --write` and `eslint --fix` on changed files only. Do not reformat untouched files.
- Do not rename, move or restructure code that is not in scope.

## R5 — Architecture boundaries (AR-002)
- `src/core` imports nothing outside `src/core`. The UI uses use cases only. Adapters only implement ports.
  Wiring happens only in `src/app/composition.ts`.
- Changing persistence (central DB or API) = new adapter + composition change, nothing else.

## R6 — Ambiguity
If the spec is ambiguous, contradictory or incomplete for the task, **stop** and propose a concrete spec amendment
(file, ID, new text) to the user. Do not guess and do not encode the guess in code.

## R7 — Milestone workflow
1. `/milestone Mx` → the **implementer** agent (`.claude/agents/implementer.md`) implements the scope and writes the
   tests for every automated TC in `spec/milestones/Mx.md`.
2. Then the **validator** agent (`.claude/agents/validator.md`) runs in a fresh context, does not modify `src/` or
   `tests/`, and writes `validation/Mx-report.md`.
3. Validator FAIL → the implementer fixes it (within scope) → validate again. Maximum 3 rounds, then escalate to the user.
4. Validator PASS → update `spec-lock.json` (`specCommit` = current spec commit, `specVersion`, milestone
   → `done`) and commit code + report + lock on the current branch as `Mx: <title> (spec <version>)`.
5. `/spec-sync` applies a committed spec change to milestones already `done` (same implementer → validator loop,
   validating **all** `done` milestones as a regression check).

## R8 — Git
- Work on a feature branch (`mx/<short-name>` or `spec/<short-name>`), never directly on `main`.
- Do not push, open PRs or trigger CI without the user's explicit permission.
