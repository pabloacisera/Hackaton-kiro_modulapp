# How to create a PR and what requirements it must meet

## Title and description

- Title: `[<feature-or-issue>] <short imperative summary>`
  Example: `[feature-admin-auth-core] Add JWT login endpoint`
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

- **One PR per feature**: when all microtasks in a feature are complete,
  create a single PR for the entire feature branch.
- **One PR per issue branch**: if the issue required its own branch, create
  one PR when the fix is complete.
- **No PR for small fixes**: if the change was committed directly (no branch),
  no PR is needed.

## Merge requirements

1. CI is green (lint + tests + build).
2. At least 1 approval (2 if touching financial code, see steering 03).
   - For financial code: human developer MUST be one of the approvers.
3. No unresolved conversations.
4. Branch is updated against `main` (rebase, no merge commit from main into
   the branch).
5. The source microtask is marked `[x]` in the corresponding `tasks.md`
   (in the same PR or an immediate follow-up commit).
6. **Only the owner can merge.** No other developer or agent can merge PRs.

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
