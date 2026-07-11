# Specs: Order management and delivery schedule

## Functional requirements

- FR1. Products/orders listing: pending, completed, delivered (unifies Flow A orders and paid Flow B quotes into a single "work to deliver" view), with search/filter/pagination.
- FR2. Pending deliveries schedule: calendar/list view sorted by estimated delivery date.
- FR3. The delivery time counter starts at the moment of acceptance (Flow A) or confirmed payment (Flow B).
- FR4. Mark an order as "delivered" (closes the counter).
- FR5. Postpone delivery date, notifying the customer by email (shares mechanism with `feature-quote-management-admin` for Flow B; for Flow A it is equivalent on `Order`).

## Non-functional requirements

- A single "pending work" view must display homogeneously items coming from `Order` (Flow A) and `Quote` (Flow B) — requires a common projection model (see design.md).

## Edge cases

- An order passes its estimated delivery date without being marked as delivered or postponed → visually highlighted as "overdue" in the schedule (does not block anything, just a visual indicator for the admin).

## Acceptance criteria

- The schedule displays in a single list sorted by date everything pending delivery, regardless of whether it comes from direct purchase or custom quote.
