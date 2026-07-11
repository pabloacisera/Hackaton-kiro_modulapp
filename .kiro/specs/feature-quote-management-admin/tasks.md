# Tasks: Quote management (admin view)

- [ ] TASK-quoteadmin-1: `GET /admin/quotes` endpoint with combined filters
  - Depends on: TASK-quoteB-2 (Quote entity)
- [ ] TASK-quoteadmin-2: `GET /admin/quotes/:id` endpoint with calculated timeline
  - Depends on: TASK-quoteadmin-1
- [ ] TASK-quoteadmin-3: `PATCH /admin/quotes/:id/postpone` endpoint + email to customer
  - Depends on: TASK-quoteadmin-1
- [ ] TASK-quoteadmin-4: `views/QuotesTable` with search/filters/pagination
  - Depends on: TASK-quoteadmin-1
- [ ] TASK-quoteadmin-5: `views/QuoteDetail` + `TimelineStatus` component
  - Depends on: TASK-quoteadmin-2
- [ ] TASK-quoteadmin-6: `views/PostponeQuoteModal`
  - Depends on: TASK-quoteadmin-3
