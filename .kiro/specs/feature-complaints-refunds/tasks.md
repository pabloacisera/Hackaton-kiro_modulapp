# Tasks: Complaints and refunds

- [ ] TASK-complaint-1: Migration for `complaints` table
  - Depends on: none
  - Assigned to: unassigned
- [ ] TASK-complaint-2: `Complaint` entity + `POST /complaints` endpoint
  - Depends on: TASK-complaint-1
  - Assigned to: unassigned
- [ ] TASK-complaint-3: Complaint receipt email to customer (with reference number)
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [ ] TASK-complaint-4: WebSocket/email notification to admin for new complaint
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [ ] TASK-complaint-5: `GET /admin/complaints` endpoint with filters/search/pagination
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [ ] TASK-complaint-6: `PATCH /admin/complaints/:id/approve-refund` endpoint
  (payment-service integration, idempotent)
  - Depends on: TASK-complaint-2, TASK-pay-11
  - Assigned to: unassigned
- [ ] TASK-complaint-7: `PATCH /admin/complaints/:id/resolve` endpoint
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [ ] TASK-complaint-8: `views/ComplaintForm` in landing
  - Depends on: TASK-complaint-2
  - Assigned to: unassigned
- [ ] TASK-complaint-9: `views/ComplaintsTable` + `ComplaintDetail` in admin
  - Depends on: TASK-complaint-5
  - Assigned to: unassigned
