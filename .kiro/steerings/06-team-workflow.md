# Team workflow — How we work together

> This document explains in simple terms how the entire development process works.
> Every team member (human or agent) must read this before starting work.

---

## ⚡ COLLABORATIVE FLOW — THE PRIMARY WORKFLOW

**This is how we work. Multiple developers, one feature, microtask PRs.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLLABORATIVE FEATURE FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Owner creates branch in repo                                            │
│     └── <number>-feature-<feature-name>                                     │
│                                                                             │
│  2. Dev1 syncs from main                                                    │
│     └── git fetch upstream && git checkout <branch>                         │
│                                                                             │
│  3. Dev1 executes microtask                                                 │
│     └── Implements task, runs tests, creates PR                             │
│         PR title: [feature/X] TASK-1: <title>                               │
│                                                                             │
│  4. Owner reviews + merges PR to main                                       │
│     └── CI green → Agent reviews → Owner merges                             │
│                                                                             │
│  5. Dev2 syncs from main (pulls the merged PR)                              │
│     └── git fetch upstream && git rebase upstream/main                       │
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
| **Fast feedback** | Each microtask is reviewed immediately after completion |
| **Easy rollback** | If something breaks, revert one small PR |
| **Clear ownership** | Each microtask has a single author |
| **No "passing the baton"** | Next developer just syncs from main and continues |

### Key rules for this flow

1. **Owner creates the branch** — developers do NOT create branches in their forks
2. **Each microtask = 1 PR** — no PRs for individual microtasks, no PRs for the entire feature
3. **Sync before starting** — always `git fetch upstream && git rebase upstream/main` (never from feature branch)
4. **Owner merges** — only the owner can merge PRs to `main`
5. **PR title format** — `[feature/<name>] TASK-<n>: <short imperative summary>`

### Recovery: What if my repo falls behind?

If your repository gets out of sync, always pull from **main**:

```bash
# Always sync from main (this brings all merged PRs)
git fetch upstream
git rebase upstream/main
```

**If you have uncommitted local changes:**
```bash
git fetch upstream
git stash                              # save your changes temporarily
git rebase upstream/main               # sync with main
git stash pop                          # restore your changes
```

**If rebase has conflicts:**
```bash
# Resolve conflicts in the files, then:
git add <resolved-files>
git rebase --continue
# If you want to abort:
git rebase --abort
```

**The rule**: always `git fetch upstream` first, then `git rebase upstream/main`. Never pull from the feature branch — main always has the latest merged PRs.

---

## Roles and permissions

| Role | Who | Can create branches | Can create PRs | Can approve PRs | Can merge | Can decide business logic |
|---|---|---|---|---|---|---|
| **Owner (Tech Lead)** | Project owner | Yes (any repo) | Yes | Yes | **YES (only one)** | Yes |
| **Developer** | Human collaborators | Yes (in their fork) | Yes | No | No | No |
| **Agent (Kiro)** | AI assistant | Yes (with approval) | Yes | No | No | No (must ask owner) |

**Golden rule: Only the owner can merge to `main`. Everyone else creates PRs and waits.**

**Feature collaboration rule: Multiple developers can work on the same feature.**
Each microtask generates its own PR. When a developer finishes their microtask,
they create a PR, and after merge, the next developer syncs from main and continues.
This enables pair programming and flexible team coordination.

## The three layers of protection

Every change goes through three layers before reaching `main`:

```
LAYER 1: Developer runs tests locally BEFORE creating PR
         ↓
LAYER 2: GitHub Actions runs tests AUTOMATICALLY when PR is created
         ↓
LAYER 3: Owner asks agent to review → agent creates branch,
         pulls PR changes, runs tests, gives report
         ↓
OWNER DECIDES: approve or request changes
```

### Why three layers?

| Layer | What it catches | Who runs it |
|---|---|---|
| **Developer's local tests** | Obvious errors, broken logic | Developer |
| **CI (GitHub Actions)** | Lint errors, failing tests, build issues | Automated |
| **Agent's review** | Code quality, missing tests, rule violations | Agent (on owner's request) |

**If code has errors, it stops at Layer 1 or 2. It never reaches the owner.**

## Feature lifecycle

### Primary: Collaborative flow (multiple developers)

See the **COLLABORATIVE FLOW** section at the top of this document for the
complete visual representation. This is the default workflow for features.

### Alternative: Single developer flow

When a single developer owns an entire feature:

```
1. Owner assigns: "You own feature X"
        ↓
2. Agent creates specs (specs.md, design.md, tasks.md)
        ↓
3. Owner reviews and approves specs
        ↓
4. Owner creates branch in repo: <number>-feature-<feature-name>
        ↓
5. Developer implements ALL microtasks (mocks dependencies if needed)
        ↓
6. Developer runs tests locally (Layer 1)
        ↓
7. Developer creates ONE PR from fork to main (entire feature)
        ↓
8. GitHub Actions runs CI (Layer 2)
        ↓
9. Owner asks agent: "Review PR #N"
        ↓
10. Agent reviews code, runs tests, gives report (Layer 3)
        ↓
11. Owner decides: merge or request changes
```

## Issue lifecycle

### Creating issues

| Who | How |
|---|---|
| **Owner** | Creates `docs/issues/ISSUE-<n>-<slug>.md` directly |
| **Collaborator** | Creates the file in their fork, submits a PR |
| **Agent** | Must ask owner before creating any issue file |

### Collaborator flow (Issues as PR)

```
Collaborator finds a bug
    ↓
Creates issue file in their fork: docs/issues/ISSUE-<n>-<slug>.md
    ↓
Submits PR with the issue file
    ↓
Owner reviews the issue
    ↓
├── REJECTS → closes PR (won't fix / duplicate / cannot reproduce)
└── ACCEPTS → merges PR → issue is now in the repo
    ↓
Fix branch is created: <n>-fix-issue-<id>-<slug>
    ↓
PR with code is created, linked to the issue
    ↓
CI runs → Agent reviews → Owner merges
    ↓
Issue file is updated with resolution
```

### Branch creation rules for fixes

| Scenario | Action |
|---|---|
| Issue with 3+ microtasks | Create branch: `<n>-fix-issue-<id>-<slug>` |
| Issue with 1-2 small tasks, no tests | Commit directly to main or active feature branch |
| High-impact issue (security, payments, data) | Create branch regardless of task count |

**A branch is only complete if all tests pass. If there are no tests (trivial issue), no branch is needed.**

## Branch naming

```
<number>-feature-<feature-name>       # for features
<number>-fix-issue-<id>-<slug>        # for issue fixes
```

Examples:
- `1-feature-admin-auth-core`
- `3-fix-issue-12-stock-double-deduction`

## Commit ownership

Commits belong to whoever made them (the author), not to the project owner.

| Who | Can commit to... | Owns commits in... |
|---|---|---|
| **Owner** | Any branch in the repo | Branches they created |
| **Developer** | Their own branches (in their fork) | Their fork |
| **Agent** | Branches it created (with approval) | Branches it created |

**Key rules:**
- The project owner does NOT own all commits — only the author does
- The project owner controls what enters `main` (via merge)
- Developers own their commits in their forks
- The agent owns its commits in branches it created
- **NOBODY** can commit directly to `main` without owner approval

## PR process

### PR scope options

| Model | When to use | PR count per feature |
|---|---|---|
| **1 microtask = 1 PR** | Collaborative features, pair programming | N microtasks = N PRs |
| **1 feature = 1 PR** | Single developer, feature complete | 1 PR per feature |

**Default**: Use "1 microtask = 1 PR" for collaborative work. Use "1 feature = 1 PR" when a single developer owns the entire feature.

### Who creates PRs?
- **Developers**: create PRs from their forks (one per microtask)
- **Agent**: creates PRs from branches in the repo
- **Owner**: can also create PRs, but will mostly review/merge

### PR title format for microtasks

```
[feature/<feature-name>] TASK-<n>: <short imperative summary>
```

Examples:
- `[feature/admin-auth] TASK-auth-1: create User entity and migration`
- `[feature/admin-auth] TASK-auth-2: implement login endpoint`

### What does the owner see?
The owner does NOT read line-by-line code. The owner sees:

1. **CI status** (green/red) — from GitHub Actions
2. **Agent's review report** — summary of issues found
3. **PR description** — what the change does, how to test

### How does the owner decide?

| CI Status | Agent Report | Owner Action |
|---|---|---|
| ✅ Green | ✅ No issues | **Approve and merge** |
| ✅ Green | ⚠️ Warnings | Review warnings, decide |
| ✅ Green | ❌ Issues found | Request changes |
| ❌ Red | — | **Cannot merge** (CI blocks it) |

### How does the owner ask the agent to review?

Simply tell the agent:
```
"Review PR #42"
```

The agent will:
1. Create a temporary branch
2. Pull the PR changes
3. Run all tests
4. Execute the code review checklist (`03-code-review.md`)
5. Give a summary report

## Code review checklist (what the agent checks)

### General (every PR)
- [ ] Resolves a single microtask (PR title matches task in tasks.md)
- [ ] Variable names in English, clear
- [ ] Unit tests present
- [ ] Error handling present
- [ ] No secrets leaked
- [ ] design.md updated if API contract changed

### Financial code (payments, refunds, stock)
- [ ] Double reviewer (agent + owner)
- [ ] Idempotent operations
- [ ] PayPal failure path tested
- [ ] BigDecimal used (not float)
- [ ] Audit log present

## When to use each type

| Situation | What to do |
|---|---|
| New business functionality (single dev) | **Feature** → specs → branch → 1 PR per feature |
| New business functionality (collaborative) | **Feature** → specs → branch → 1 PR per microtask |
| Bug with 3+ microtasks | **Issue** → branch → 1 PR per microtask |
| Bug with 1-2 small tasks | **Issue** → commit directly |
| High-impact change (payments, security) | **Issue** → branch always |
| Cosmetic fix (typo, spacing) | **Commit directly** to main |
| Need business decision | **Ask owner** (never assume) |

## Unresolved conversations

A PR cannot be merged if there are unresolved conversations (comments that
have not been addressed). Every comment must be either:
- Fixed with a new commit
- Acknowledged and resolved by the author

The agent must not resolve conversations on behalf of the owner.

## Authorization points for the agent

See `.kiro/steerings/00-project-context.md` § Authorization points for the agent for the full list.

## Agent limitations — What the agent CANNOT do

The agent is a tool to assist, not to decide. Here is what the agent
**cannot** do without explicit owner approval:

### Code changes
- ❌ Cannot merge PRs
- ❌ Cannot approve PRs
- ❌ Cannot commit directly to main without asking
- ❌ Cannot decide a fix is "small enough" to skip PR process
- ❌ Cannot make autonomous changes to production code

### Documentation
- ❌ Cannot create issue files without asking
- ❌ Cannot update feature-status.md without asking
- ❌ Cannot update collaboration-log.md without asking
- ❌ Cannot update team.md without asking
- ❌ Cannot update ANY documentation file without asking

### Decisions
- ❌ Cannot decide business logic (must ask owner)
- ❌ Cannot reinterpret specs (must follow as written)
- ❌ Cannot resolve conversations on behalf of owner
- ❌ Cannot approve or reject PRs

### What the agent CAN do without asking
- ✅ Commit to branches it created (after branch is created with approval)
- ✅ Run tests
- ✅ Execute lint and type checks
- ✅ Give code review reports (when asked or proactively)
- ✅ Suggest actions (approve, request changes, split PR)
- ✅ Inform owner about PR status
- ✅ Create specs (specs.md, design.md, tasks.md) — but owner must approve before coding
- ✅ Report upstream changes and flag possible task overlap after syncing a collaborator's branch against upstream/main

## Difference from standard GitHub

| Concept | Standard GitHub | Our system |
|---|---|---|
| PR scope | One per feature, branch, or fix | One per microtask (collaborative) OR one per feature (single dev) |
| Issue tracking | GitHub Issues | Markdown files in `docs/issues/` (created via PR by collaborators) |
| Branch naming | Free-form | Strict: `<n>-feature-<name>` or `<n>-fix-issue-<id>-<slug>` |
| Code review | Anyone can review | Owner reviews everything. Agent assists. |
| Merge authority | Whoever approves can merge | **Only owner can merge** |
| Tests | May not exist | Branch is only complete if tests pass |
| Decisions | Discussed in issues | Agent never assumes — always asks owner |
| Feature collaboration | Usually single developer | Multiple developers via microtask PRs |

### Why markdown files instead of GitHub Issues?

- **Version control**: issues are tracked in git, like code
- **Quality control**: owner reviews issues before accepting (via PR)
- **Consistency**: all issues follow the exact template format
- **Integration**: agent can read issues from the filesystem
