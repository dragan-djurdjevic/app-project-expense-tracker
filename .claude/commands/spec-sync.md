---
description: Apply committed spec changes to milestones that are already done (regenerate affected code only)
---

Follow `CLAUDE.md` R2 and R7.5:

1. Check that there are no uncommitted changes under `spec/` and that `spec/CHANGELOG.md` has an entry for the current
   `spec/VERSION`. If not, stop and tell me.
2. Show me `git diff <specCommit> HEAD --stat -- spec/` and the list of changed spec IDs. If the diff is empty, report
   "Spec unchanged — nothing to do" and stop **without touching code**.
3. Launch the `implementer` subagent with target `sync`.
4. Launch the `validator` subagent with target `sync` (it validates all `done` milestones as regression).
5. Same FAIL loop and PASS handling as `/milestone`; the commit message is `chore(spec-sync): apply spec <version>`, with the
   `specCommit` updated in `spec-lock.json`. Do not push.
