# Hook: on-financial-change

**Trigger**: a diff/PR includes files within `apps/payment-service/**` or `apps/api-core/**` that touch entities `Order`, `Quote` (paid/accepted status), `Stock`, `Refund`, or `Receipt`.

**Actions the agent must execute automatically:**

1. Attach the financial section checklist from `.kiro/steerings/03-code-review.md` to the PR as a comment.
2. Label the PR with `financial-critical`.
3. Remind (automatic comment) that 2 approvers are required, not 1.
4. Explicitly suggest verifying: idempotency, PayPal failure handling, and that there are no race conditions on stock/order.

**Do not**: block the PR itself — the hook informs and reminds, the actual blocking is done by the repo's approval rule (branch protection).
