# Contributing

Guidelines for human collaborators and their coding agents working on this
project. For the full agent rules, see `.kiro/steerings/00-project-context.md`.

## Getting started

1. **Fork** the repository (collaborators work via forks — only the owner
   can push directly to `main`).
2. Read `.kiro/steerings/00-project-context.md` (project context) and
   `.kiro/steerings/06-team-workflow.md` (how we work together).
3. Set up your local environment: copy `.env.example` to `.env`, fill in
   values, run `bash scripts/dev-up.sh`. See
   `.kiro/steerings/09-environment-variables.md` for what each variable does.

## Branching and PRs

- **Feature branches**: `<number>-feature-<feature-name>` (e.g.,
  `1-feature-admin-auth-core`). **Always create in your own fork**, not
  in the owner's repo. Everyone works in parallel.
- **Issue branches**: `<number>-fix-issue-<id>-<slug>` (e.g.,
  `3-fix-issue-12-stock-double-deduction`).
- **Small fixes** (1-2 files, no tests): commit directly to `main` or the
  active feature branch — but ask the owner first.

**One PR per feature**: when ALL microtasks are complete, create a single
PR from your fork to `main`. Do NOT create PRs for individual microtasks.
If your feature depends on another that isn't merged yet, mock it (see
`docs/integration-testing-guide.md`). **Only the owner merges.** See
`.kiro/steerings/04-pull-requests.md` for the full PR format and merge
requirements.

## Keeping your fork in sync

Add the owner's repo as a second remote, once, right after forking:

```
git remote add upstream <owner-repo-url>
```

Before starting any new microtask, and again before opening your PR, bring
in what changed upstream and replay your commits on top of it:

```
git fetch upstream
git rebase upstream/main
```

If you had already pushed this branch to your own fork before rebasing,
force-push it (only ever to YOUR OWN fork, never to `upstream`):

```
git push --force-with-lease origin <your-branch>
```

`--force-with-lease` (not plain `--force`) protects you: if someone else
pushed to that same branch on your fork in the meantime, the push stops
instead of silently overwriting it.

**If your agent runs this sync for you**, it must report back first: what
landed upstream since your last sync (commits/PRs, author, one-line
summary), which files those commits touched, and whether any of them
overlap with your current task (checked against `tasks.md` /
`docs/feature-status.md`). Do not let it rebase silently and move on to
your next step without showing you this first.

## What you can do

- Implement microtasks assigned to you in `tasks.md`.
- Run tests locally before opening a PR.
- Open PRs from your fork.
- Leave informal peer feedback on any PR (regardless of who worked on what).
- Create issue files in your fork and submit them as PRs (see
  `.kiro/steerings/02-issues-y-bugs.md`).

## What your agent can do (and cannot)

Your coding agent (Kiro, Claude, Copilot, etc.) may work on your behalf, but
it **must** follow the same authorization points as the project's own agent
(see `.kiro/steerings/00-project-context.md` § Authorization points):

- **Never** assume business logic — always ask the owner.
- **Never** commit directly to `main` without owner confirmation.
- **Never** merge or approve PRs.
- **Never** skip the microtask decomposition rule (max half a day per task,
  max 2-3 files — see `.kiro/steerings/01-feature-flow.md` §2).
- **Never** touch the financial microservice's idempotency or audit
  requirements without flagging for the reinforced review in
  `.kiro/steerings/03-code-review.md`.

## Commit messages

Follow `docs/commit-conventions.md` exactly: subject line format, required
body for non-trivial changes, and one commit = one logical change.

## Financial code review

Any change touching `services/payment-service/**` or financial entities in
`services/api-core/**` requires **two approvers**, one of whom must be a
human developer (not the PR author). See
`.kiro/steerings/03-code-review.md` § Reinforced section.

## Off-limits (for everyone, human or agent)

- Committing directly to `main` without owner approval.
- Bypassing branch protection.
- Editing `.env` once populated (immutable — see
  `.kiro/steerings/00-project-context.md` § Environment variables).
- Changing business decisions in `00-project-context.md` without owner
  sign-off.

## If in doubt, ask the owner

Do not assume. The owner has final say on all business logic, merge
decisions, and spec interpretation.
