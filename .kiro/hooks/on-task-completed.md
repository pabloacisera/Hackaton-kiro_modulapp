# Hook: on-task-completed

**Trigger**: a microtask is marked `[x]` in any `tasks.md`.

**Actions the agent must execute automatically:**

1. Verify the task has its done criterion met (run tests if the deliverable is code).
2. Verify there is at least one test for the deliverable, if applicable.
3. Automatically add a draft entry to `docs/collaboration-log.md` (date, feature, task, author detected from the commit) — the human only confirms.
4. If the task was the last pending one in the feature, mark the feature as "ready for final review" in `docs/feature-status.md` and notify.

**Do not**: close the PR or merge automatically — that is always decided by a human.
