# Tasks: Quote management (admin view)

- [ ] TASK-quoteadmin-1: `GET /admin/quotes` endpoint with combined filters
  - Context: FR1 requires separate/filterable listings by status. FR2 requires search by customer name/email and filters by date and amount range. This endpoint powers the admin quotes table with pagination.
  - Deliverable: `apps/api-core/src/modules/quotes/quotes.controller.ts`, `apps/api-core/src/modules/quotes/quotes.service.ts`
  - Depends on: TASK-quoteB-2 (Quote entity)
  - Assigned to: unassigned
  - Done criteria: GET /admin/quotes returns paginated results. Query params `status`, `search`, `dateFrom`, `dateTo`, `amountMin`, `amountMax` filter results correctly. Unit test `unit.quoteadmin.list.filterByStatus` passes. Unit test `unit.quoteadmin.list.filterByDateRange` passes. Unit test `unit.quoteadmin.list.filterByAmountRange` passes. Unit test `unit.quoteadmin.list.pagination` passes.

- [ ] TASK-quoteadmin-2: `GET /admin/quotes/:id` endpoint with calculated timeline
  - Context: FR3 requires quote detail view with status history (timeline: created → quoted → accepted/rejected/expired → paid). The edge case in the spec states the timeline must reflect real order by timestamp, not arrival order.
  - Deliverable: `apps/api-core/src/modules/quotes/quotes.controller.ts`, `apps/api-core/src/modules/quotes/quotes.service.ts`
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
  - Done criteria: GET /admin/quotes/:id returns quote with `timeline` array sorted by timestamp ascending. Unit test `unit.quoteadmin.timeline.calculatesFromTimestamps` passes. Unit test `unit.quoteadmin.timeline.sortsByTimestamp` passes.

- [ ] TASK-quoteadmin-3: `PATCH /admin/quotes/:id/postpone` endpoint + email to customer
  - Context: FR5 requires postpone action on already-agreed delivery date, triggering email to customer (see `feature-custom-quote` FR10). Postpone must validate future date and that quote is in a postponable state.
  - Deliverable: `apps/api-core/src/modules/quotes/quotes.controller.ts`, `apps/api-core/src/modules/quotes/quotes.service.ts`
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
  - Done criteria: PATCH /admin/quotes/:id/postpone with valid future date updates delivery date and sends email. Returns 400 if date is in the past. Returns 400 if quote is not in a postponable state. Unit test `unit.quoteadmin.postpone.validatesFutureDate` passes. Unit test `unit.quoteadmin.postpone.blocksOnNonPostponableState` passes.

- [ ] TASK-quoteadmin-4: `views/QuotesTable` with search/filters/pagination
  - Context: FR1 and FR2 require a filterable listing table with search by customer name/email, filters by date and amount range, and pagination. General dashboard rule requires every table has search + pagination + at least one filter per relevant column.
  - Deliverable: `apps/admin/src/views/QuotesTable.tsx`, `apps/admin/src/components/QuoteFilters.tsx`
  - Depends on: TASK-quoteadmin-1
  - Assigned to: unassigned
  - Done criteria: QuotesTable renders paginated rows from GET /admin/quotes. Search input filters by customer name/email. Status filter dropdown with options: quoted, accepted, rejected, expired, archived, paid. Date range and amount range filter controls present. Pagination controls navigate pages. Unit test `unit.quoteadmin.ui.quotesTable.rendersRows` passes. Unit test `unit.quoteadmin.ui.quotesTable.searchFilters` passes.

- [ ] TASK-quoteadmin-5: `views/QuoteDetail` + `TimelineStatus` + `PostponeQuoteModal` (detail page)
  - Context: FR3 requires quote detail view with status history timeline. FR5 requires postpone action accessible from detail view. FR4 requires archive/delete action from rejected/expired. Detail view and postpone modal are part of the same page.
  - Deliverable: `apps/admin/src/views/QuoteDetail.tsx`, `apps/admin/src/components/TimelineStatus.tsx`, `apps/admin/src/components/PostponeQuoteModal.tsx`
  - Depends on: TASK-quoteadmin-2, TASK-quoteadmin-3
  - Assigned to: unassigned
  - Done criteria: QuoteDetail fetches quote via GET /admin/quotes/:id and renders status, customer info, and delivery date. TimelineStatus renders timeline entries sorted by timestamp ascending. PostponeQuoteModal opens from detail page, submits PATCH /admin/quotes/:id/postpone, validates future date client-side. Archive/delete button visible for rejected/expired quotes. Unit test `unit.quoteadmin.ui.quoteDetail.rendersTimeline` passes. Unit test `unit.quoteadmin.ui.postponeModal.validatesFutureDate` passes.

- [ ] TASK-quoteadmin-6: Integration tests for admin quote management
  - Context: End-to-end validation of listing with combined filters, timeline calculation from stored timestamps, and postpone flow with email notification. Uses seeded quotes in various states.
  - Deliverable: `apps/api-core/src/modules/quotes/**/*.integration-spec.ts`
  - Depends on: TASK-quoteadmin-5
  - Assigned to: unassigned
  - Done criteria: integration.quoteadmin.list.filterByStatus passes. integration.quoteadmin.list.filterByDateRange passes. integration.quoteadmin.list.filterByAmountRange passes. integration.quoteadmin.list.pagination passes. integration.quoteadmin.detail.calculatesTimelineFromTimestamps passes. integration.quoteadmin.postpone.updatesDateAndSendsEmail passes. All tests green.
