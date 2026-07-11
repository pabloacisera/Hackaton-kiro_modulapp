# How to create a feature

## 1. Mandatory structure

Every feature lives in `.kiro/specs/<feature-name>/` with exactly three files:

- **specs.md** — What is being built and why. Functional and non-functional
  requirements, business rules, edge cases, acceptance criteria. No implementation
  details.
- **design.md** — How it is built. Technical decisions, diagrams (text/mermaid),
  API contracts (endpoints, DTOs), affected data model, state diagram if applicable.
  Include a `## Cross-feature dependencies` section when this feature depends on
  another feature that may not be merged yet (see format below).
- **tasks.md** — List of executable microtasks, in dependency order.

### Cross-feature dependencies format (in design.md)

Use only when a feature depends on another feature that may not be merged yet:

```md
## Cross-feature dependencies
- Depends on: <feature-name> (status: merged | in-progress | not-started)
- If not merged: <how this feature branch will integrate — wait for merge,
  branch off the dependency's branch, or work against a mocked contract>
```

## 2. Golden rule: microtask decomposition (NOT NEGOCIABLE)

No task in `tasks.md` can involve more than **half a day of developer work**
or touch more than 2-3 new files significantly. If a task is larger, break it
down. Examples:

- ❌ "Implement custom quote flow"
- ✅ "Create `Quote` entity + `quotes` table migration"
- ✅ "Endpoint `POST /quotes` with name/email/phone required validation"
- ✅ "BullMQ job that marks quote as expired after 48h without response"
- ✅ "Quote email template with signed accept/reject buttons"

Each task in `tasks.md` must follow this format:

```md
- [ ] TASK-<feature>-<n>: <short title in imperative>
  - Context: <why this task exists>
  - Deliverable: <what file/endpoint/component is created>
  - Depends on: <TASK-x, or "none">
  - Assigned to: <name, or "unassigned">
  - Done criteria: <how to verify it is finished>
```

The agent MUST NOT mark a task as started or in-progress if `Assigned to` is
"unassigned" — it must ask whoever is coordinating (owner or whoever ran the
sprint/planning meeting) who is taking it first.

This rule applies to **all agents** (Kiro or other) that generate tasks. A
large feature (e.g., "custom quote") may generate 15-30 microtasks; that is
expected and correct.

## 3. Feature lifecycle

1. Create the folder `.kiro/specs/<feature>/` with `specs.md` first.
2. The human (owner) reviews and approves `specs.md` before moving to `design.md`.
3. Write `design.md`. If there is unresolved business ambiguity, stop and
   ask — never assume (see `00-project-context.md`).
4. Decompose into `tasks.md` following the microtask rule.
5. **Create a feature branch** (see naming conventions below).
6. Implement microtasks within the feature branch. The agent commits each
   microtask with proper commit messages — NOT a separate PR per microtask.
   Commits belong to the agent (author), not to the project owner.
7. When all tasks in the feature are complete, create **one PR for the entire feature**.
8. After merge, mark the feature as complete in `docs/feature-status.md`.
   **IMPORTANT**: The agent MUST ask owner confirmation before updating
   `docs/feature-status.md` or any other documentation file.

## 4. Branch naming conventions

### Features
```
<number>-feature-<feature-name>
```
Examples:
- `1-feature-admin-auth-core`
- `2-feature-catalog-landing`
- `5-feature-direct-purchase`

### Issues (with multiple tasks)
```
<number>-fix-issue-<issue-id>-<slug>
```
Examples:
- `3-fix-issue-12-stock-double-deduction`
- `7-fix-issue-25-email-not-sending`

### Small fixes (single task, no tests needed)
Commit directly to `main` or the active feature branch (if the fix belongs to
that feature). No branch required. Follow commit message conventions (see `docs/commit-conventions.md`). Commits should be atomic — split unrelated fixes into separate commits even when small.

**IMPORTANT**: The agent MUST ask owner confirmation before committing directly
to main. Even small fixes require explicit owner approval. The agent cannot
decide on its own that a fix is "small enough" to skip the PR process.

### Impact-based branch creation
The severity/impact of a change can also authorize branch creation. A high-impact
change (even if small in scope) should get its own branch for safety. Examples:
- Fix affecting payment processing
- Security-related change
- Database migration

## 5. When to create a branch vs. commit directly

| Scenario | Action |
|---|---|
| New feature | Create feature branch |
| Issue with 3+ microtasks | Create issue branch |
| Issue with 1-2 small tasks, no tests | Commit directly to main/feature branch |
| High-impact change (security, payments, data) | Create branch regardless of size |
| Cosmetic fix (typo, spacing) | Commit directly |

## 6. When to open a new feature vs. an issue

- **New feature**: business functionality that does not exist yet (see initial
  list in `docs/roadmap.md`).
- **Issue/bug**: something that already existed and stopped behaving as the
  `specs.md` originally indicates (see `02-issues-y-bugs.md`).

## 7. Agent authorization points

See `.kiro/steerings/00-project-context.md` § Authorization points for the agent for the full list.
