# Tasks: Custom quote (Flow B)

- [ ] TASK-quoteB-1: Migration for `quotes` table
  - Depends on: none
  - Assigned to: unassigned

- [ ] TASK-quoteB-2: `Quote` domain entity + state machine with guards
  - Depends on: TASK-quoteB-1
  - Assigned to: unassigned
  - Done criterion: tests for invalid transitions being blocked

- [ ] TASK-quoteB-3: `POST /quotes` endpoint with strict name/email/phone validation
  - Depends on: TASK-quoteB-2
  - Assigned to: unassigned

- [ ] TASK-quoteB-4: Incomplete data discard path + admin notification (does not create `pending` state)
  - Depends on: TASK-quoteB-3
  - Assigned to: unassigned

- [ ] TASK-quoteB-5: "Received, status pending" confirmation email to customer
  - Depends on: TASK-quoteB-3
  - Assigned to: unassigned

- [ ] TASK-quoteB-6: `PATCH /quotes/:id/present` endpoint (admin quotes)
  - Depends on: TASK-quoteB-2
  - Assigned to: unassigned

- [ ] TASK-quoteB-7: Signed one-time-use token generation (JWT) for accept/reject
  - Depends on: TASK-quoteB-6
  - Assigned to: unassigned

- [ ] TASK-quoteB-8: Quote email with accept/reject buttons (deep link with token)
  - Depends on: TASK-quoteB-7
  - Assigned to: unassigned

- [ ] TASK-quoteB-9: `GET /quotes/:id/accept` endpoint with token verification, expiration and single-use (transactional)
  - Depends on: TASK-quoteB-7
  - Assigned to: unassigned

- [ ] TASK-quoteB-10: `GET /quotes/:id/reject` endpoint (same security criteria as accept)
  - Depends on: TASK-quoteB-7
  - Assigned to: unassigned

- [ ] TASK-quoteB-11: Admin notification on rejection (for archiving)
  - Depends on: TASK-quoteB-10
  - Assigned to: unassigned

- [ ] TASK-quoteB-12: Integration with payment-service to generate payment link on accept, with 24h `payment_deadline`
  - Depends on: TASK-quoteB-9
  - Assigned to: unassigned

- [ ] TASK-quoteB-13: BullMQ job `quote-expiration-check` (48h without response)
  - Depends on: TASK-quoteB-6
  - Assigned to: unassigned

- [ ] TASK-quoteB-14: BullMQ job `quote-payment-expiration-check` (24h without payment)
  - Depends on: TASK-quoteB-12
  - Assigned to: unassigned

- [ ] TASK-quoteB-15: `PATCH /quotes/:id/archive` endpoint
  - Depends on: TASK-quoteB-2
  - Assigned to: unassigned

- [ ] TASK-quoteB-16: Admin listing `GET /quotes` with filters/search/pagination
  - Depends on: TASK-quoteB-2
  - Assigned to: unassigned

- [ ] TASK-quoteB-17: Landing UI — quote request form
  - Depends on: TASK-quoteB-3
  - Assigned to: unassigned

- [ ] TASK-quoteB-18: Public accept/reject result pages (success, expired link, already processed)
  - Depends on: TASK-quoteB-9, TASK-quoteB-10
  - Assigned to: unassigned

- [ ] TASK-quoteB-19: Admin UI — quoting screen (price + deadline form)
  - Depends on: TASK-quoteB-6
  - Assigned to: unassigned

- [ ] TASK-quoteB-20: Admin notification on payment completion + delivery timer start
  - Depends on: TASK-quoteB-12, feature-order-delivery-schedule
  - Assigned to: unassigned
