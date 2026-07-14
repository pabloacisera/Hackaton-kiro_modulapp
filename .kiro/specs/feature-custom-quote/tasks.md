# Tasks: Custom quote (Flow B)

- [ ] TASK-quoteB-1: Migration for `quotes` table + `Quote` domain entity + state machine with guards
  - Context: FR3 requires `pending` state for valid requests. FR4 requires `quoted` with price/deadline fields. FR5 requires `rejected`. FR6 requires `accepted`, `payment_initiated`, `paid`. FR7 requires `expired`. Non-functional: state machine must guard against invalid transitions and prevent double-processing.
  - Deliverable: `services/api-core/src/modules/quotes/infrastructure/database/migrations/<timestamp>_create_quotes_table.ts`, `services/api-core/src/modules/quotes/domain/quote.entity.ts`, `services/api-core/src/modules/quotes/domain/quote-state-machine.ts`, `services/api-core/src/modules/quotes/domain/quote-state-machine.spec.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: migration runs and rolls back cleanly on PostgreSQL; Quote entity exposes states `pending | quoted | accepted | rejected | expired | payment_initiated | paid | discarded`; valid transitions (pending→quoted, quoted→accepted, quoted→rejected, quoted→expired, accepted→payment_initiated, payment_initiated→paid) succeed; invalid transitions (e.g. pending→accepted, rejected→paid) throw; unit tests cover all valid transitions allowed, all invalid transitions blocked, and terminal states (paid, expired, discarded) reject further transitions. All tests pass.

- [ ] TASK-quoteB-2: `POST /quotes` endpoint + incomplete data discard + admin notification + confirmation email
  - Context: FR1 requires name, email, phone all mandatory plus description and deadline. FR2 requires discarding requests missing any of name/email/phone and notifying the admin with what was received. FR3 requires valid requests to transition to `pending` and send a confirmation email to the customer ("we received your request, status: pending") while notifying the admin.
  - Deliverable: `services/api-core/src/modules/quotes/interface/http/create-quote.controller.ts`, `services/api-core/src/modules/quotes/interface/http/dto/create-quote.dto.ts`, `services/api-core/src/modules/quotes/application/create-quote.use-case.ts`, `services/api-core/src/modules/quotes/application/create-quote.use-case.spec.ts`, `services/api-core/src/modules/quotes/interface/http/routes.ts`
  - Depends on: TASK-quoteB-1
  - Assigned to: unassigned
  - Done criteria: POST /quotes with missing name returns 422 with field-level errors and does NOT create a quote row; POST /quotes with missing email returns 422; POST /quotes with missing phone returns 422; POST /quotes with all three missing returns 422; incomplete requests trigger admin notification email containing received fields; POST /quotes with valid name+email+phone+description+deadline creates a quote in `pending` state and sends confirmation email to customer; unit tests cover all discard scenarios, valid creation, and email dispatch. All tests pass.

- [ ] TASK-quoteB-3: `PATCH /quotes/:id/present` endpoint (admin quotes)
  - Context: FR4 requires admin to review the request, enter price (USD) and approximate execution time, and transition the quote to `quoted`. This triggers the accept/reject email flow handled in downstream tasks.
  - Deliverable: `services/api-core/src/modules/quotes/interface/http/present-quote.controller.ts`, `services/api-core/src/modules/quotes/interface/http/dto/present-quote.dto.ts`, `services/api-core/src/modules/quotes/application/present-quote.use-case.ts`, `services/api-core/src/modules/quotes/application/present-quote.use-case.spec.ts`
  - Depends on: TASK-quoteB-1
  - Assigned to: unassigned
  - Done criteria: PATCH /quotes/:id/present with valid price and deadline on a `pending` quote transitions to `quoted`; PATCH on non-pending quote returns error; PATCH with missing price or deadline returns 422; PATCH on non-existent quote returns 404; unit tests cover valid presentation, invalid state rejection, validation errors, and not-found. All tests pass.

- [ ] TASK-quoteB-4: Signed one-time-use token generation (JWT) for accept/reject
  - Context: Non-functional requirement: Accept/reject links must work without customer account (signed links with expiration). FR4 requires 48h window. NFR2: links must not be reusable. Token must contain quote ID, expiry, and be single-use.
  - Deliverable: `services/api-core/src/modules/quotes/application/token.service.ts`, `services/api-core/src/modules/quotes/application/token.service.spec.ts`
  - Depends on: TASK-quoteB-1
  - Assigned to: unassigned
  - Done criteria: generateToken produces a JWT with quoteId, action (accept|reject), and exp claims; verifyToken accepts valid non-expired non-used token; verifyToken rejects expired token; verifyToken rejects already-used token; atomic mark-as-used prevents double-click (concurrent calls: exactly one succeeds); unit tests cover generation claims, verification success, expiry rejection, double-use rejection, and atomic prevention. All tests pass.

- [ ] TASK-quoteB-5: Quote email with accept/reject buttons (deep link with token)
  - Context: FR4 requires sending a quote email to customer with Accept/Reject buttons. Links are signed tokens pointing to public API endpoints. Must be one-time-use (NFR2).
  - Deliverable: `services/api-core/src/modules/quotes/application/send-quote-email.use-case.ts`, `services/api-core/src/modules/quotes/application/send-quote-email.use-case.spec.ts`, `services/api-core/src/modules/quotes/infrastructure/email/templates/quote-presented.template.ts`
  - Depends on: TASK-quoteB-3, TASK-quoteB-4
  - Assigned to: unassigned
  - Done criteria: sendQuoteEmail generates tokens for both accept and reject actions; email contains two distinct deep-link buttons; links include valid JWT tokens; email is sent to customer's address; unit tests cover token generation for both actions, correct URLs in email, and email dispatch. All tests pass.

- [ ] TASK-quoteB-6: Accept + Reject endpoints with token verification (structurally identical)
  - Context: FR5: if customer rejects → quote moves to `rejected`. FR6: if customer accepts → quote moves to `accepted` and payment link is generated. FR7: 48h window. NFR2: single-use tokens. Edge cases: expired link shows "expired, request a new one" page; double-click shows current state safely.
  - Deliverable: `services/api-core/src/modules/quotes/interface/http/accept-quote.controller.ts`, `services/api-core/src/modules/quotes/interface/http/reject-quote.controller.ts`, `services/api-core/src/modules/quotes/application/process-quote-response.use-case.ts`, `services/api-core/src/modules/quotes/application/process-quote-response.use-case.spec.ts`
  - Depends on: TASK-quoteB-1, TASK-quoteB-4
  - Assigned to: unassigned
  - Done criteria: GET /quotes/:id/accept with valid token on `quoted` quote transitions to `accepted`; GET /quotes/:id/reject with valid token transitions to `rejected`; expired token returns 410 with expired state; already-used token returns current state (no double processing); token for wrong quote ID returns 403; token with wrong action (accept token on reject endpoint) returns 403; non-quoted quote returns appropriate error; unit tests cover all scenarios including valid accept, valid reject, expired token, used token, wrong quote, wrong action, wrong state. All tests pass.

- [ ] TASK-quoteB-7: Admin notification on rejection
  - Context: FR5 requires notifying the admin when the customer rejects so they can archive or delete the quote.
  - Deliverable: `services/api-core/src/modules/quotes/application/notify-admin-on-rejection.use-case.ts`, `services/api-core/src/modules/quotes/application/notify-admin-on-rejection.use-case.spec.ts`
  - Depends on: TASK-quoteB-6
  - Assigned to: unassigned
  - Done criteria: upon rejection, admin receives notification email with quote details and customer info; notification includes action suggestion (archive/delete); unit tests cover notification sent on rejection, notification not sent on other transitions. All tests pass.

- [ ] TASK-quoteB-8: Integration with payment-service to generate payment link on accept
  - Context: FR6 requires generating a payment link (PayPal) upon acceptance with a 24h payment deadline. After the deadline the link can no longer be used.
  - Deliverable: `services/api-core/src/modules/quotes/application/initiate-payment.use-case.ts`, `services/api-core/src/modules/quotes/application/initiate-payment.use-case.spec.ts`, `services/api-core/src/modules/quotes/infrastructure/payment/payment-gateway.adapter.ts`
  - Depends on: TASK-quoteB-6
  - Assigned to: unassigned
  - Done criteria: upon acceptance, payment link is generated via payment-service; quote transitions to `payment_initiated` with `payment_deadline` set to 24h from acceptance; payment link is returned to the client; unit tests cover successful link generation, transition to payment_initiated, deadline calculation, and payment-service error handling. All tests pass.

- [ ] TASK-quoteB-9: Webhook endpoint `POST /api/quotes/webhooks/payment-result`
  - Context: FR8 requires payment confirmation to transition quote to `paid` and start the delivery timer. Payment-service calls this endpoint to confirm payment result. Without it, quotes cannot reach `paid` state.
  - Deliverable: `services/api-core/src/modules/quotes/interface/http/payment-result-webhook.controller.ts`, `services/api-core/src/modules/quotes/interface/http/dto/payment-result-webhook.dto.ts`, `services/api-core/src/modules/quotes/application/process-payment-result.use-case.ts`, `services/api-core/src/modules/quotes/application/process-payment-result.use-case.spec.ts`
  - Depends on: TASK-quoteB-8
  - Assigned to: unassigned
  - Done criteria: validates webhook signature/origin (rejects unauthenticated requests with 401); successful payment transitions `payment_initiated` → `paid`; sends confirmation email to customer; notifies admin via WebSocket; returns 200 to payment-service; duplicate webhook is idempotent (returns 200, no duplicate emails); unit tests cover signature validation, successful transition, email dispatch, WebSocket notification, idempotency, and rejection of invalid signatures. All tests pass.

- [ ] TASK-quoteB-10: Expiration jobs — quote response (48h) + payment deadline (24h)
  - Context: FR7 requires an automatic job to mark quotes as `expired` after 48h without customer response. FR6 requires a 24h payment deadline after acceptance — if unpaid, the quote expires.
  - Deliverable: `services/api-core/src/modules/quotes/infrastructure/jobs/quote-expiration-check.job.ts`, `services/api-core/src/modules/quotes/infrastructure/jobs/quote-payment-expiration-check.job.ts`, `services/api-core/src/modules/quotes/infrastructure/jobs/quote-expiration-check.spec.ts`, `services/api-core/src/modules/quotes/infrastructure/jobs/quote-payment-expiration-check.spec.ts`
  - Depends on: TASK-quoteB-1, TASK-quoteB-9
  - Assigned to: unassigned
  - Done criteria: `quote-expiration-check` job finds `quoted` quotes past 48h and transitions to `expired`; `quote-payment-expiration-check` job finds `payment_initiated` quotes past payment_deadline and transitions to `expired`; neither job touches quotes in other states; expired quotes are not processed twice; unit tests cover expiration of quoted quotes, expiration of payment-initiated quotes, skipping non-eligible quotes, and idempotent re-runs. All tests pass.

- [ ] TASK-quoteB-11: Archive endpoint + admin listing with filters/search/pagination
  - Context: FR5 requires admin to archive rejected quotes. FR7 requires admin to manually archive expired quotes. Admin needs a listing view to manage all quotes.
  - Deliverable: `services/api-core/src/modules/quotes/interface/http/archive-quote.controller.ts`, `services/api-core/src/modules/quotes/interface/http/list-quotes.controller.ts`, `services/api-core/src/modules/quotes/interface/http/dto/list-quotes.dto.ts`, `services/api-core/src/modules/quotes/application/archive-quote.use-case.ts`, `services/api-core/src/modules/quotes/application/list-quotes.use-case.ts`, `services/api-core/src/modules/quotes/application/archive-quote.use-case.spec.ts`, `services/api-core/src/modules/quotes/application/list-quotes.use-case.spec.ts`
  - Depends on: TASK-quoteB-1
  - Assigned to: unassigned
  - Done criteria: PATCH /quotes/:id/archive transitions rejected/expired quotes to `archived`; archive on non-archivable state returns error; GET /quotes returns paginated list; filters by status, date range, and text search work; unit tests cover archive of rejected, archive of expired, archive rejection for non-archivable states, listing pagination, filtering, and search. All tests pass.

- [ ] TASK-quoteB-12: Landing UI — quote request form + public accept/reject result pages
  - Context: FR1 requires a form with name, email, phone (all mandatory), description, and deadline. Non-functional: accept/reject links are public pages (no account needed). Edge cases: expired link page ("this quote expired, request a new one"), already-processed link page (shows current state).
  - Deliverable: `frontend/src/features/quotes/pages/QuoteRequestPage.tsx`, `frontend/src/features/quotes/pages/AcceptResultPage.tsx`, `frontend/src/features/quotes/pages/RejectResultPage.tsx`, `frontend/src/features/quotes/components/QuoteRequestForm.tsx`
  - Depends on: TASK-quoteB-2, TASK-quoteB-6
  - Assigned to: unassigned
  - Done criteria: quote request form renders name, email, phone, description, deadline fields; all three contact fields are required; form POSTs to /quotes endpoint; success shows confirmation message; accept result page shows success state, expired state, and already-processed state based on API response; reject result page shows analogous states; pages are publicly accessible without auth; component tests cover form validation, submission, and result page state rendering. All tests pass.

- [ ] TASK-quoteB-13: Admin UI — quoting screen (price + deadline form)
  - Context: FR4 requires admin to review requests and enter price (USD) and approximate execution time. This is the admin dashboard screen for managing quotes.
  - Deliverable: `frontend/src/features/quotes/pages/AdminQuoteDetailPage.tsx`, `frontend/src/features/quotes/pages/AdminQuoteListPage.tsx`, `frontend/src/features/quotes/components/PresentQuoteForm.tsx`, `frontend/src/features/quotes/components/QuoteStatusBadge.tsx`
  - Depends on: TASK-quoteB-3, TASK-quoteB-11
  - Assigned to: unassigned
  - Done criteria: admin detail page shows quote request details (customer info, description, deadline); present quote form has price (USD, numeric) and execution time fields; form submits to PATCH /quotes/:id/present; status badge renders correct color/label for each state; listing page shows paginated quotes with filters; component tests cover form validation, submission, and status badge rendering. All tests pass.

- [ ] TASK-quoteB-14: Admin notification on payment completion + delivery timer start
  - Context: FR8 requires admin notification when payment is completed and the delivery time counter starts (`feature-order-delivery-schedule`). FR9 requires receipt generation via `feature-payment-billing-java`.
  - Deliverable: `services/api-core/src/modules/quotes/application/notify-payment-completed.use-case.ts`, `services/api-core/src/modules/quotes/application/notify-payment-completed.use-case.spec.ts`
  - Depends on: TASK-quoteB-9
  - Assigned to: unassigned
  - Done criteria: upon `paid` transition, admin receives notification email with quote and payment details; delivery schedule integration is triggered; receipt generation is invoked; unit tests cover admin notification, delivery trigger, and receipt invocation on paid; no-op if quote already paid (idempotent). All tests pass.

- [ ] TASK-quoteB-integration: Integration test for full quote lifecycle
  - Context: validates the complete Flow B lifecycle end-to-end: create quote → present → accept → payment initiation → payment webhook → paid. Also covers: incomplete data discard, rejection flow, expiration jobs, archive. Uses Supertest with mocked payment-service and mocked BullMQ.
  - Deliverable: `services/api-core/src/modules/quotes/__tests__/quotes.integration-spec.ts`
  - Depends on: TASK-quoteB-14, TASK-quoteB-12, TASK-quoteB-13
  - Assigned to: unassigned
  - Done criteria: integration.quote.create.missingFieldsCreatesDiscarded; integration.quote.create.validFieldsCreatesPending; integration.quote.present.movesToQuotedAndSendsEmail; integration.quote.accept.verifiesTokenAndMovesToAccepted; integration.quote.accept.expiredTokenReturnsError; integration.quote.accept.usedTokenReturnsCurrentState; integration.quote.reject.movesToRejected; integration.quote.expirationJob.movesExpiredQuotes; integration.quote.paymentExpirationJob.movesPaymentExpiredQuotes; integration.quote.archive.movesRejectedToArchived; integration.quote.webhook.paymentResultMovesToPaid; integration.quote.webhook.duplicateWebhookIsIdempotent; integration.quote.listing.paginationAndFiltersWork. All tests pass.
