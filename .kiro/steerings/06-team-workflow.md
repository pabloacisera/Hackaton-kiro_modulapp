# Team workflow — How we work together

> This document explains in simple terms how the entire development process works.
> Every team member (human or agent) must read this before starting work.

## Roles and permissions

| Role | Who | Can create branches | Can create PRs | Can approve PRs | Can merge | Can decide business logic |
|---|---|---|---|---|---|---|
| **Owner (Tech Lead)** | Project owner | Yes (any repo) | Yes | Yes | **YES (only one)** | Yes |
| **Developer** | Human collaborators | Yes (in their fork) | Yes | No | No | No |
| **Agent (Kiro)** | AI assistant | Yes (with approval) | Yes | No | No | No (must ask owner) |

**Golden rule: Only the owner can merge to `main`. Everyone else creates PRs and waits.**

**Feature ownership rule: 1 developer = 1 complete feature.** Each developer
owns a feature from first task to PR. No two developers work on the same
feature branch. This eliminates coordination overhead and ensures clear
accountability.

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

**Sequential dependencies**: Features are numbered (`1-`, `2-`, etc.) and
must be completed in order. A developer cannot start feature N+1 until
feature N is merged to `main`. The owner coordinates this sequence.

**Branch location**: Each developer creates their feature branch **in their
own fork**, not in the owner's repo. This prevents branch name collisions
and keeps the owner's repo clean.

```
1. Owner assigns: "You own feature X"
        ↓
2. Developer checks dependency status:
   - If feature has no dependency → start immediately
   - If feature depends on feature N → wait until feature N is merged to main
        ↓
3. Agent creates specs (specs.md, design.md, tasks.md)
        ↓
4. Owner reviews and approves specs
        ↓
5. Developer creates branch IN THEIR FORK: <number>-feature-<feature-name>
        ↓
6. Developer implements ALL microtasks in the feature branch
        ↓
7. Developer runs tests locally (Layer 1)
        ↓
8. Developer creates ONE PR from fork to main (entire feature)
        ↓
9. GitHub Actions runs CI (Layer 2)
        ↓
10. Owner asks agent: "Review PR #N"
        ↓
11. Agent reviews code, runs tests, gives report (Layer 3)
        ↓
12. Owner reads agent's report and decides
        ↓
13. Owner merges (only owner can merge)
        ↓
14. Next feature can now begin
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

### Who creates PRs?
- **Developers**: create PRs from their forks
- **Agent**: creates PRs from branches in the repo
- **Owner**: can also create PRs, but will mostly review/merge

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
- [ ] Resolves a single microtask
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
| New business functionality | **Feature** → specs → branch → PR |
| Bug with 3+ tasks | **Issue** → branch → PR |
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
| PR scope | One per feature, branch, or fix | One per feature OR issue branch. Small fixes = direct commit |
| Issue tracking | GitHub Issues | Markdown files in `docs/issues/` (created via PR by collaborators) |
| Branch naming | Free-form | Strict: `<n>-feature-<name>` or `<n>-fix-issue-<id>-<slug>` |
| Code review | Anyone can review | Owner reviews everything. Agent assists. |
| Merge authority | Whoever approves can merge | **Only owner can merge** |
| Tests | May not exist | Branch is only complete if tests pass |
| Decisions | Discussed in issues | Agent never assumes — always asks owner |

### Why markdown files instead of GitHub Issues?

- **Version control**: issues are tracked in git, like code
- **Quality control**: owner reviews issues before accepting (via PR)
- **Consistency**: all issues follow the exact template format
- **Integration**: agent can read issues from the filesystem
