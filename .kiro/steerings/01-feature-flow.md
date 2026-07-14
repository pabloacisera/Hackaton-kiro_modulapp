# How to create a feature

---

## ⚡ COLLABORATIVE FEATURE FLOW — THE PRIMARY WORKFLOW

**This is how we build features. Multiple developers, microtask PRs.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLLABORATIVE FEATURE FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Owner creates branch in repo                                            │
│     └── <number>-feature-<feature-name>                                     │
│                                                                             │
│  2. Dev1 syncs                                                              │
│     └── git fetch upstream && git checkout <branch>                         │
│                                                                             │
│  3. Dev1 executes microtask                                                 │
│     └── Implements task, runs tests, creates PR                             │
│         PR title: [feature/X] TASK-1: <title>                               │
│                                                                             │
│  4. Owner reviews + merges PR                                               │
│     └── CI green → Agent reviews → Owner merges                             │
│                                                                             │
│  5. Dev2 syncs                                                              │
│     └── git fetch upstream && git pull upstream <branch>                     │
│                                                                             │
│  6. Dev2 executes microtask                                                 │
│     └── Implements task, runs tests, creates PR                             │
│         PR title: [feature/X] TASK-2: <title>                               │
│                                                                             │
│  7. Repeat until all microtasks complete                                    │
│     └── Feature done — no final PR needed (all already merged)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why this flow?

| Benefit | Explanation |
|---|---|
| **No fork coordination** | Everyone works from the same upstream branch |
| **Fast feedback** | Each microtask is reviewed immediately |
| **Easy rollback** | Revert one small PR if something breaks |
| **Clear ownership** | Each microtask has a single author |
| **No "passing the baton"** | Next developer just syncs and continues |

### Key rules

1. **Owner creates the branch** — developers do NOT create branches in their forks
2. **Each microtask = 1 PR** — no PRs for individual microtasks, no PRs for the entire feature
3. **Sync before starting** — always `git fetch upstream && git pull upstream <branch>`
4. **Owner merges** — only the owner can merge PRs to `main`
5. **PR title format** — `[feature/<name>] TASK-<n>: <short imperative summary>`

### Recovery: What if my repo falls behind?

If your repository gets out of sync, just pull the latest from upstream:

```bash
# Bring latest changes from the feature branch
git fetch upstream
git pull upstream <feature-branch>

# Or bring latest changes from main
git fetch upstream
git pull upstream main
```

**If you have uncommitted local changes:**
```bash
git fetch upstream
git stash                          # save your changes temporarily
git pull upstream <feature-branch>
git stash pop                      # restore your changes
```

**If you have commits in your fork not in upstream:**
```bash
git fetch upstream
git rebase upstream/<feature-branch>
git push --force-with-lease origin <feature-branch>  # push to your fork
```

**The rule**: always `git fetch upstream` first to see what changed, then `git pull` to integrate. If there are merge conflicts, resolve them before continuing.

---

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

### Microtask quality rules (DoD)

Every task in `tasks.md` MUST include all five fields:
- **Context**: why this task exists, referencing the spec section (e.g., "FR3: customer must provide email")
- **Deliverable**: specific file paths or endpoints created
- **Depends on**: TASK-x or "none"
- **Assigned to**: name or "unassigned"
- **Done criteria**: verifiable, testable condition (e.g., "unit test X passes", "curl returns 200")

**Tests are embedded, not separate.** Each implementation task includes its
unit test as part of the Done criteria. There are NO standalone unit test
tasks. The only exception is ONE integration test task at the end of each
feature that covers cross-cutting scenarios.

**Group tightly coupled tasks.** If two tasks depend on each other to produce
standalone value (e.g., migration + entity, accept + reject endpoints with
shared token logic), merge them into one task. A PR that only creates a
migration file without the entity that uses it produces no "valuable" code.

**Don't go too small.** A task that creates a single email template, a single
modal component, or a single config file is too small to justify a PR. Group
it with the task that gives it context.

**Don't go too big.** A task that touches 4+ unrelated modules (e.g.,
integrating notifications across direct-purchase, quotes, complaints, AND
low-stock) should be split into one task per integration point.

## 3. Feature lifecycle

1. Create the folder `.kiro/specs/<feature>/` with `specs.md` first.
2. The human (owner) reviews and approves `specs.md` before moving to `design.md`.
3. Write `design.md`. If there is unresolved business ambiguity, stop and
   ask — never assume (see `00-project-context.md`).
4. Decompose into `tasks.md` following the microtask rule.
5. **Owner creates feature branch in the repo** (see naming conventions below).
   Developers sync via upstream.
6. Implement microtasks. Each microtask generates its own PR:
   - Developer syncs: `git fetch upstream && git checkout <branch>`
   - Developer implements microtask
   - Developer creates PR: `[feature/<name>] TASK-<n>: <title>`
   - Owner reviews + merges PR
   - Next developer syncs and continues
7. After all microtasks are merged, the feature is complete.
8. Mark the feature as complete in `docs/feature-status.md`.
   **IMPORTANT**: The agent MUST ask owner confirmation before updating
   `docs/feature-status.md` or any other documentation file.

### PR model options

| Model | When to use | PR count per feature |
|---|---|---|
| **1 microtask = 1 PR** | Collaborative features, pair programming | N microtasks = N PRs |
| **1 feature = 1 PR** | Single developer, feature complete | 1 PR per feature |

**Default**: Use "1 microtask = 1 PR" for collaborative work. Use "1 feature = 1 PR" when a single developer owns the entire feature.

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
