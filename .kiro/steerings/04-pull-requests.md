# How to create a PR and what requirements it must meet

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
│     └── git pull upstream main                                               │
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
| **No "passing the baton"** | Next developer just syncs from main and continues |

### Key rules

1. **Owner creates the branch** — developers do NOT create branches in their forks
2. **Each microtask = 1 PR** — no PRs for individual microtasks, no PRs for the entire feature
3. **Sync before starting** — always `git pull upstream main` (never from feature branch)
4. **Owner merges** — only the owner can merge PRs to `main`
5. **PR title format** — `[feature/<name>] TASK-<n>: <short imperative summary>`

### Recovery: What if my repo falls behind?

If your repository gets out of sync, always pull from **main**:

```bash
# Always sync from main (this brings all merged PRs)
git pull upstream main
```

If you have conflicts, ask the owner for help resolving them.

**The rule**: always `git pull upstream main`. Never pull from the feature branch — main always has the latest merged PRs.

---

## Title and description

- Title: `[<feature-or-issue>] <short imperative summary>`
  Examples:
  - `[feature/admin-auth] TASK-auth-1: create User entity and migration`
  - `[feature/admin-auth] TASK-auth-2: implement login endpoint`
  - `[feature-admin-auth-core] Add JWT login endpoint` (for feature-level PRs)
- Mandatory description with this format:

```md
## What it does
<1-3 lines>

## Related task/issue
TASK-<feature>-<n> (or FIX-ISSUE-<n>)

## How to test it
<manual steps or test command>

## Checklist
- [ ] Passes `03-code-review.md` (general)
- [ ] Passes financial section (if applicable)
- [ ] Updated design.md if I changed a contract
- [ ] Added my line to docs/collaboration-log.md
```

## PR scope rules

### PR model options

| Model | When to use | PR count per feature |
|---|---|---|
| **1 microtask = 1 PR** | Collaborative features, pair programming | N microtasks = N PRs |
| **1 feature = 1 PR** | Single developer, feature complete | 1 PR per feature |

**Default**: Use "1 microtask = 1 PR" for collaborative work. Use "1 feature = 1 PR" when a single developer owns the entire feature.

- **One PR per microtask (collaborative model)**: each microtask generates
  its own PR. After merge to main, next developer syncs from main and
  continues. This enables pair programming and flexible team coordination.
- **One PR per feature (single developer model)**: when ALL microtasks in a
  feature are complete, create a single PR for the entire feature branch.
- **One PR per issue branch**: if the issue required its own branch, create
  one PR when the fix is complete.
- **No PR for small fixes**: if the change was committed directly (no branch),
  no PR is needed.
- **Branch lives in the repo**: the owner creates the feature branch in the
  repo. Developers sync via upstream.

## Merge requirements

1. CI is green (lint + tests + build).
2. At least 1 approval (2 if touching financial code, see steering 03).
   - For financial code: human developer MUST be one of the approvers.
3. No unresolved conversations.
4. Branch is up to date with `main` (no merge commits from main into the branch).
5. The source microtask is marked `[x]` in the corresponding `tasks.md`
   (in the same PR or an immediate follow-up commit).
6. **Only the owner can merge.** No other developer or agent can merge PRs.
7. **Delete the branch after merge.** Both the remote branch and any local
   tracking branch must be deleted immediately after the PR is merged.
   Stale branches clutter the repo and confuse automation.

## Who can merge?

**Only the owner (tech lead) can merge PRs to `main`.**

| Who creates PR | Who approves | Who merges |
|---|---|---|
| Developer (from fork) | Owner | **Owner** |
| Agent (from branch) | Owner | **Owner** |
| Owner | Agent reviews | **Owner** |

This ensures complete control over what enters the main branch.

## Branch naming (reminder)

```
<number>-feature-<feature-name>       # for features
<number>-fix-issue-<id>-<slug>        # for issue fixes
```

Examples:
- `1-feature-admin-auth-core`
- `3-fix-issue-12-stock-double-deduction`

**Note**: For collaborative features, the owner creates the branch in the repo.
Developers sync via upstream, not by creating branches in their forks.

## PR size

If a PR exceeds ~400 lines of diff (excluding generated files/lockfiles),
assume the task was not well decomposed — document why in the description
or split it.

## Unresolved conversations

A PR **cannot** be merged if there are unresolved conversations (comments from
reviewers that have not been addressed). Every comment must be either:
- Fixed with a new commit
- Acknowledged and resolved by the author

The agent must not resolve conversations on behalf of the human reviewer.
The human reviewer has the final say on marking conversations as resolved.
