# Tasks: Quote management (admin view)

- [ ] TASK-quoteadmin-1: `GET /admin/quotes` endpoint with combined filters
  - Depends on: TASK-quoteB-2 (Quote entity)
  - Assigned to: unassigned
- [ ] TASK-quoteadmin-2: `GET /admin/quotes/:id` endpoint with calculated timeline
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
- [ ] TASK-quoteadmin-3: `PATCH /admin/quotes/:id/postpone` endpoint + email to customer
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
- [ ] TASK-quoteadmin-4: `views/QuotesTable` with search/filters/pagination
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
- [ ] TASK-quoteadmin-5: `views/QuoteDetail` + `TimelineStatus` component
  - Depends on: TASK-quoteadmin-2
  - Assigned to: unassigned
- [ ] TASK-quoteadmin-6: `views/PostponeQuoteModal`
  - Depends on: TASK-quoteadmin-3
  - Assigned to: unassigned

- [ ] TASK-quoteadmin-test1: Unit tests for admin quote management logic
  - Context: admin quote operations (timeline calculation, postpone validation) must be tested. Covers: timeline calculation from stored timestamps, postpone validates future date, postpone validates quote is in a postponable state.
  - Deliverable: `services/api-core/src/modules/quotes/**/*.spec.ts` (admin-specific unit tests)
  - Depends on: TASK-quoteadmin-3
  - Assigned to: unassigned
  - Done criteria: unit.quoteadmin.timeline.calculatesFromTimestamps, unit.quoteadmin.postpone.validatesFutureDate, unit.quoteadmin.postpone.blocksOnNonPostponableState. All pass.

- [ ] TASK-quoteadmin-test2: Integration tests for admin quote management
  - Context: validates listing with combined filters, timeline calculation from stored timestamps, and postpone flow with email notification. Uses Supertest with seeded quotes in various states.
  - Deliverable: `services/api-core/src/modules/quotes/**/*.integration-spec.ts` (admin-specific tests)
  - Depends on: TASK-quoteadmin-6
  - Assigned to: unassigned
  - Done criteria: integration.quoteadmin.list.filterByStatus, integration.quoteadmin.list.filterByDateRange, integration.quoteadmin.list.filterByAmountRange, integration.quoteadmin.list.pagination, integration.quoteadmin.detail.calculatesTimelineFromTimestamps, integration.quoteadmin.postpone.updatesDateAndSendsEmail. All pass.
