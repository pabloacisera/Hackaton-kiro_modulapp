# Tasks: Order management and delivery schedule

- [ ] TASK-delivery-1: SQL view/projection `DeliveryItem` (UNION orders+quotes)
  - Depends on: TASK-compraA-2, TASK-quoteB-2
- [ ] TASK-delivery-2: `GET /admin/deliveries` endpoint with filters/search/pagination
  - Depends on: TASK-delivery-1
- [ ] TASK-delivery-3: `PATCH /admin/deliveries/:origin/:id/deliver` endpoint
  - Depends on: TASK-delivery-1
- [ ] TASK-delivery-4: `PATCH /admin/deliveries/:origin/:id/postpone` endpoint
  (equivalent for `Order`, reuses existing for `Quote`)
  - Depends on: TASK-delivery-1
- [ ] TASK-delivery-5: `views/DeliveriesBoard` (calendar/list with overdue indicator)
  - Depends on: TASK-delivery-2
- [ ] TASK-delivery-6: `views/DeliveriesTable`
  - Depends on: TASK-delivery-2
