# How to register an issue/bug and plan the fix

## 1. Issue registration

Every issue is documented in `docs/issues/ISSUE-<n>-<slug>.md` (see template in
`docs/templates/issue.md`) with:

- **Affected feature**: reference to `.kiro/specs/<feature>/specs.md`.
- **Severity**: `critical` (money/payments/incorrect stock), `high` (blocks a
  complete flow), `medium` (affects UX without blocking), `low` (cosmetic).
- **Steps to reproduce**.
- **Expected behavior** (per original `specs.md`) vs. **observed**.
- **Evidence**: logs, screenshots, transaction/order ID if applicable.
- **Reported by**: name of the person who created the issue.
- **Assigned to**: name of the person working on the fix.

## 2. How to create an issue (collaborators vs owner)

### Owner

The owner can create issues directly:
1. Create the file `docs/issues/ISSUE-<n>-<slug>.md` following the template.
2. Commit directly to `main` or create a branch if the fix is complex.

### Collaborators (fork-based workflow)

Collaborators create issues via **Pull Requests**:

1. **Fork** the repository (if not already forked).
2. **Create the issue file** in your fork:
   ```
   docs/issues/ISSUE-<n>-<slug>.md
   ```
   Follow the template in `docs/templates/issue.md`.
3. **Submit a PR** with the issue file.
4. **Owner reviews** the issue:
   - Is it valid? (reproducible, not a duplicate)
   - Is it well-documented? (clear steps, evidence)
   - Is the severity correct?
5. **Owner decides**:
   - ✅ **Approve**: merge the PR → issue is now in the repo
   - ❌ **Reject**: close the PR with explanation (won't fix / duplicate / cannot reproduce)

### Agent

The agent **MUST ask owner confirmation** before creating issue files in
`docs/issues/`. The agent cannot create issues on its own.

## 3. Severity and financial issues

Any issue with `critical` severity involving payments, refunds, stock, or
receipts automatically activates the reinforced review from
`03-code-review.md` §Financial section.

## 4. Branch creation rules for issues

| Scenario | Action |
|---|---|
| Issue with 3+ microtasks | Create branch: `<n>-fix-issue-<id>-<slug>` |
| Issue with 1-2 small tasks, no tests needed | Commit directly to `main` or active feature branch |
| High-impact issue (security, payments, data) | Create branch regardless of task count |

**Rule**: a branch is only considered complete if all tests pass. If there are
no tests (because the issue is trivial), the branch is not needed — commit
directly.

## 5. Fix planning

1. Identify the root cause before touching code (no blind patching).
2. Decide if the fix requires updating `design.md` of the original feature:
   - If the bug reveals the design was wrong → update `design.md` first,
     with a changelog note at the bottom.
   - If it is a specific implementation error → do not touch `design.md`.
3. The fix is decomposed into microtasks just like a new feature (see
   `01-feature-flow.md` §2), added to the `tasks.md` of the
   `.kiro/specs/<feature>/` folder under a `## Fixes` heading with reference
   to the issue (`FIX-ISSUE-<n>`).

## 6. Collaboration log

Every closed task or fix must add a line to `docs/collaboration-log.md`
with this format:

```
YYYY-MM-DD | <feature or issue> | <task/fix> | <author> | <PR link>
```

This is a flat, append-only log for traceability — do not retroactively
edit lines except for obvious typos.

**IMPORTANT**: The agent MUST ask owner confirmation before adding lines to
`docs/collaboration-log.md`. The agent cannot update the log on its own.

## 7. Issue closure

When an issue is closed, update the issue file with:
- **Closed by**: name of the person who closed it.
- **Closed on**: date.
- **Resolution**: fixed / won't fix / duplicate / cannot reproduce.
