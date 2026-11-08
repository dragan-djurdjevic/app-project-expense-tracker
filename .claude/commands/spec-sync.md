---
description: Apply committed spec changes to milestones that are already done (regenerate affected code only)
---

Follow `CLAUDE.md` R2 and R7.5:

1. Check that there are no uncommitted changes under `spec/` and that `spec/CHANGELOG.md` has an entry for the current
   `spec/VERSION`. If not, stop and tell me.
2. Show me `git diff <specCommit> HEAD --stat -- spec/` and the list of changed spec IDs. If the diff is empty, report
   "Spec unchanged — nothing to do" and stop **without touching code**.
3. Launch the `implementer` subagent with target `sync`, passing the changed IDs from step 2 (it reads only those
   spec sections and the files whose `Spec:` header lists them).
4. Launch the `validator` subagent with target `sync`, passing the changed IDs. It fully verifies the changed IDs and
   checks all other `done` milestones as regression-only (green tests + `spec:trace`).
5. Same FAIL loop and PASS handling as `/milestone`; the commit message is `chore(spec-sync): apply spec <version>`, with the
   `specCommit` updated in `spec-lock.json`. Do not push.
