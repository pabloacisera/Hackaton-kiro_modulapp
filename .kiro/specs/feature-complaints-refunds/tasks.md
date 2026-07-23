# Tasks: Complaints and refunds

- [x] TASK-complaint-1: Migration for `complaints` table
  - Depends on: none
  - Assigned to: unassigned
- [x] TASK-complaint-2: `Complaint` entity + `POST /complaints` endpoint
  - Depends on: TASK-complaint-1
  - Assigned to: unassigned
- [x] TASK-complaint-3: Complaint receipt email to customer (with reference number)
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [x] TASK-complaint-4: WebSocket/email notification to admin for new complaint
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [x] TASK-complaint-5: `GET /admin/complaints` endpoint with filters/search/pagination
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [x] TASK-complaint-review: `PATCH /admin/complaints/:id/review` endpoint (transitions `received` → `under_review`)
  - Context: the Complaint state machine includes `under_review` but no endpoint triggered it. This task adds the explicit endpoint for admins to mark a complaint as actively reviewed.
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
  - Done criteria: endpoint transitions `received` → `under_review`, returns 400 for invalid transitions (e.g., `refund_approved` → `under_review`).
- [x] TASK-complaint-6: `PATCH /admin/complaints/:id/approve-refund` endpoint
      (payment-service integration, idempotent)
  - Depends on: TASK-complaint-2, TASK-pay-11
  - Assigned to: unassigned
- [x] TASK-complaint-7: `PATCH /admin/complaints/:id/resolve` endpoint
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [x] TASK-complaint-8: `views/ComplaintForm` in landing
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [x] TASK-complaint-9: `views/ComplaintsTable` + `ComplaintDetail` in admin
  - Depends on: TASK-complaint-5
  - Assigned to: unassigned

- [x] TASK-complaint-test1: Unit tests for complaint status transitions
  - Context: Complaint entity state machine must block invalid transitions and allow valid ones. Covers: received→under_review, under_review→refund_approved, under_review→rejected, under_review→resolved_other_way. Blocks: received→refund_approved (must review first), refund_approved→rejected (terminal state).
  - Deliverable: `services/api-core/src/modules/complaints/**/*.spec.ts`
  - Depends on: TASK-complaint-7
  - Assigned to: unassigned
  - Done criteria: unit.complaint.validTransitions.allAllowed, unit.complaint.invalidTransitions.allBlocked, unit.complaint.unknownReferenceBlocksRefund. All pass.

- [ ] TASK-complaint-test2: Integration tests for complaint flow
  - Context: validates POST complaint → email + notification, approve-refund → payment-service mock call, resolve flow. Uses Supertest with mocked payment-service, mocked Mailjet, mocked WebSocket.
  - Deliverable: `services/api-core/src/modules/complaints/**/*.integration-spec.ts`
  - Depends on: TASK-complaint-9
  - Assigned to: unassigned
  - Done criteria: integration.complaint.create.sendsReceiptAndNotifiesAdmin, integration.complaint.create.unknownReferenceStillRegistered, integration.complaint.approveRefund.callsPaymentServiceMock, integration.complaint.approveRefund.unknownRefTypeReturnsError, integration.complaint.approveRefund.duplicateRefundRequestReturnsExisting, integration.complaint.resolve.savesResolutionNotes. All pass.
