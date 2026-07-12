# Tasks: Order management and delivery schedule

- [ ] TASK-delivery-1: SQL view/projection `DeliveryItem` (UNION orders+quotes)
  - Depends on: TASK-directpurchase-2, TASK-quoteB-2
  - Assigned to: unassigned
- [ ] TASK-delivery-2: `GET /admin/deliveries` endpoint with filters/search/pagination
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
- [ ] TASK-delivery-3: `PATCH /admin/deliveries/:origin/:id/deliver` endpoint
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
- [ ] TASK-delivery-4: `PATCH /admin/deliveries/:origin/:id/postpone` endpoint
  (equivalent for `Order`, reuses existing for `Quote`)
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
- [ ] TASK-delivery-5: `views/DeliveriesBoard` (calendar/list with overdue indicator)
  - Depends on: TASK-delivery-2
  - Assigned to: unassigned
- [ ] TASK-delivery-6: `views/DeliveriesTable`
  - Depends on: TASK-delivery-2
  - Assigned to: unassigned

- [ ] TASK-delivery-test1: Unit tests for delivery projection and overdue logic
  - Context: DeliveryItem projection logic must be tested. Covers: UNION query correctly merges accepted orders and paid quotes, overdue calculation (today > estimated_delivery_date and status != delivered), deliver action sets delivered_at, postpone action updates estimated_delivery_date.
  - Deliverable: `services/api-core/src/modules/deliveries/**/*.spec.ts`
  - Depends on: TASK-delivery-4
  - Assigned to: unassigned
  - Done criteria: unit.delivery.projection.mergesOrdersAndQuotes, unit.delivery.overdue.calculatedCorrectly, unit.delivery.deliver.setsDeliveredAt, unit.delivery.postpone.updatesEstimatedDate. All pass.

- [ ] TASK-delivery-test2: Integration tests for DeliveryItem projection and actions
  - Context: validates that the UNION query correctly merges accepted orders and paid quotes into DeliveryItem. Tests: filtering, pagination, overdue calculation (today > estimated_delivery_date), deliver action, postpone action. Uses Supertest with test DB containing seeded orders and quotes in various states.
  - Deliverable: `services/api-core/src/modules/deliveries/**/*.integration-spec.ts`
  - Depends on: TASK-delivery-6
  - Assigned to: unassigned
  - Done criteria: integration.delivery.projection.includesAcceptedOrders, integration.delivery.projection.includesPaidQuotes, integration.delivery.projection.excludesNonDeliverableStatuses, integration.delivery.list.filterByStatus, integration.delivery.list.pagination, integration.delivery.overdue.calculatedCorrectly, integration.delivery.deliver.setsDeliveredAt, integration.delivery.postpone.updatesEstimatedDate. All pass.
