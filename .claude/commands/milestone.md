---
description: Implement and validate a milestone from spec/ (usage /milestone M1)
argument-hint: M1|M2|M3|M4|M5
---

Run milestone **$ARGUMENTS** following `CLAUDE.md` R7:

1. Check the preconditions: on a feature branch (not `main`), no uncommitted changes under `spec/`, earlier milestones
   `done` in `spec-lock.json`. If one fails, stop and tell me.
2. Launch the `implementer` subagent with target `$ARGUMENTS`. Relay its report summary to me.
   The agents follow their **Token budget** section; don't paste spec or code into their prompts.
3. If the implementer stopped on an ambiguity or proposed a spec amendment, stop and show it to me.
4. Launch the `validator` subagent with target `$ARGUMENTS` (fresh context; don't pass on the implementer's claims).
5. On FAIL: continue the **same** implementer (SendMessage) with the report's findings instead of launching a new one. Repeat validation. At most 3 rounds, then stop and
   show me the report.
6. On PASS or PASS-WITH-PENDING: update `spec-lock.json` (`specCommit` = `git log -1 --format=%H -- spec/`,
   `specVersion` = `spec/VERSION`, `$ARGUMENTS` → `done`), then commit everything as
   `feat($ARGUMENTS): <milestone title> (spec <version>)`. Do not push.
7. Summarise: verdict, test counts, pending CI/manual items, report path.
