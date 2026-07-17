# How to review code (code review)

## General checklist (every PR)

- [ ] The PR resolves **a single** microtask from `tasks.md` (or a single fix).
  If it touches more than one, split it.
- [ ] Variable/function names in English, clear, and not abbreviated unnecessarily.
- [ ] No "magic" business logic without comments — if a rule comes from
  `specs.md`, reference it (`// see specs.md#section`).
- [ ] Unit tests for new business logic (minimum: happy path +
  1 relevant edge case from `specs.md`).
- [ ] Explicit error handling — no empty `catch` or `any` to hide a type
  that is not understood.
- [ ] No secrets/keys leaked — sensitive variables only via `.env` (see
  `.kiro/steerings/09-environment-variables.md`).
- [ ] If the change affects an API contract (request/response), update
  `design.md` of the corresponding feature in the same PR.
- [ ] Responsive/mobile-first verified if the change is frontend-related
  (screenshots in PR: mobile + desktop).

## Reinforced section — financial code (payments, refunds, stock, receipts)

Applies to all changes in `apps/payment-service` (Java) and any code in
`apps/api-core` touching `stock`, `orders`, `quotes` in
accepted/paid state.

- [ ] **Mandatory double reviewer** (a single approver is not enough).
  In the context of one human developer + agent:
  - The human MUST review all financial code changes.
  - The agent can perform the initial review, but human approval is required.
  - Both must approve before merge.
- [ ] Verified that no race condition is possible on the same resource
  (e.g., two simultaneous acceptances of the same order, double stock deduction).
- [ ] Every money operation (charge, refund) is **idempotent** — retrying the
  same operation must not charge/refund twice (use idempotency key).
- [ ] Tested the PayPal **rejection/failure** path, not just the happy path.
- [ ] Amounts are handled in whole units (cents) or `BigDecimal`/`Decimal`,
  never `float`/`double`.
- [ ] Every generated receipt is persisted before attempting to send via
  email (if email fails, the receipt is not lost).
- [ ] An audit log is registered (who/what/when) for every financial
  operation, immutable.

## What blocks a merge

Any unchecked item in the financial section blocks the merge without exception,
even if the rest of the PR is perfect.

## Unresolved conversations

A PR cannot be merged if there are **unresolved conversations** (comments from
reviewers that have not been addressed or replied to). This is a standard
code review practice — every comment must be either:
- Fixed with a new commit
- Acknowledged and resolved by the author

The agent must not resolve conversations on behalf of the human reviewer.

## How the owner requests a review

When there is a PR to review, the owner tells the agent:
```
"Review PR #N"
```

The agent will:
1. Create a temporary branch
2. Pull the PR changes
3. Run all tests
4. Execute this checklist (03-code-review.md)
5. Give a summary report to the owner

The owner then reads the summary and decides: approve or request changes.

## Proactive review by the agent

The agent CAN proactively review PRs without being asked. However:

- **CAN**: Inform the owner about a PR (e.g., "PR #42 is ready for review")
- **CAN**: Suggest actions (e.g., "I recommend approving", "Consider splitting this PR")
- **CANNOT**: Make autonomous changes to the code
- **CANNOT**: Approve or merge PRs
- **MUST**: Wait for owner approval/rejection before acting on any suggestion

The agent's role is to assist and inform, not to decide. The owner has
the final say on all PR-related decisions.
