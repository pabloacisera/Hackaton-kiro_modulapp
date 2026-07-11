# Specs: Quote management (admin view)

## Functional requirements

- FR1. Separate/filterable listings by status: sent (`quoted`), accepted, rejected, expired, archived, paid.
- FR2. Each listing with search (by customer name/email) and filters by date and amount range.
- FR3. Quote detail view with status history (timeline: created → quoted → accepted/rejected/expired → paid).
- FR4. Archive/delete action from rejected/expired.
- FR5. Postpone already-agreed delivery date action (triggers email to customer, see `feature-custom-quote` FR10).

## Non-functional requirements

- Reuses the `Quote` domain from `feature-custom-quote` — this feature is the admin UI/listings layer on top of that domain, no new entities are created.

## Edge cases

- A quote with multiple status changes in quick succession (e.g., quoted and expired almost simultaneously due to race with the job) → the timeline must reflect the real order by timestamp, not by arrival order to the UI.

## Acceptance criteria

- Every table has search + pagination + at least one filter per relevant column, no exceptions (general dashboard rule, see `.kiro/steerings/08-admin-ui-conventions.md`).
