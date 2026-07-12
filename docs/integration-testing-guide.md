# Integration Testing Guide

This document explains how to write cross-feature integration tests in this
project. Every developer must read this before writing tests for their feature.

## What are cross-feature integration tests?

These tests validate that **your feature** correctly communicates with
**another feature's** service via HTTP. You test your side of the contract,
not the other service's internals.

Example: `direct-purchase` calls `payment-service` to initiate payment. The
integration test validates that `direct-purchase`:
1. Sends the correct HTTP request to `payment-service`
2. Processes the response correctly
3. Handles error scenarios correctly
4. Processes the webhook callback correctly

## Who writes them?

**The calling feature writes the tests.** The feature that makes the HTTP
call is responsible for testing that the call works correctly.

- `direct-purchase` writes tests for Order→Payment
- `custom-quote` writes tests for Quote→Payment
- `complaints-refunds` writes tests for Complaint→Refund

## How to mock the dependency?

Since the dependency may not be deployed yet (sequential model), you mock
the service based on its **documented contract**:

1. Read the dependency's `design.md` — it defines all endpoints, request/
   response formats, and webhook formats.
2. Read `flows/<dependency>.txt` — it explains the full behavior.
3. Build a mock server that responds according to the contract.

The mock is **black-box**: you don't need to know the internal implementation.
You only need to know what HTTP requests it receives and what it responds.

### Mock accuracy

The mock is based on:
- `design.md` of the dependency (API contract)
- `flows/<dependency>.txt` (behavioral description)
- `specs.md` of the dependency (business rules and edge cases)

If the dependency changes its API without updating `design.md`, the mock
will be wrong. This is a documentation maintenance issue — keep design.md
up to date.

### Mock technology

| Caller stack | Mock approach |
|---|---|
| NestJS (api-core) | Use `@nestjs/testing` + `HttpService` mock or `nock` library |
| Java (payment-service) | Use WireMock or MockRestServiceServer |
| Frontend (React) | Use MSW (Mock Service Worker) or `fetch` mock |

## What scenarios to test?

For each cross-feature interaction, test:

1. **Happy path**: the complete flow works end-to-end
2. **Service unavailable**: dependency returns 500/503 → your feature handles gracefully
3. **Invalid response**: dependency returns unexpected format → your feature doesn't crash
4. **Idempotency**: sending the same request twice returns the same result
5. **Webhook processing**: callback from dependency updates your state correctly

## Naming convention

Follow the test naming from `05-architecture-conventions.md`:

```
integration.<caller-feature>.<scenario>.<expected-result>
```

Examples:
- `integration.directpurchase.paymentInitiation.sendsCorrectRequest`
- `integration.directpurchase.webhookOK.updatesOrderToPaid`
- `integration.directpurchase.webhookFailed.movesToPaymentFailed`
- `integration.complaint.approveRefund.callsPaymentServiceMock`
- `integration.quote.accept.initiatesPaymentLink`

## Cross-feature scenarios by feature

### direct-purchase → payment-service

| Scenario | What to validate |
|---|---|
| Initiate payment | POST /payments/orders with correct order_id, amount_usd, customer_email |
| Payment OK webhook | Order moves to paid_pending_acceptance, email sent, admin notified |
| Payment failed webhook | Order moves to payment_failed |
| Reject order | POST /payments/orders/:ref/refund called, refund processed |
| Idempotency | Same idempotency_key returns existing Payment, no duplicate |

Source: `feature-direct-purchase/design.md` §Contract with payment-service

### custom-quote → payment-service

| Scenario | What to validate |
|---|---|
| Accept quote → payment | POST /payments/orders with quote_id, amount, email |
| Payment OK webhook | Quote moves to paid |
| Payment expired | Job moves quote to payment_expired |

Source: `feature-custom-quote/design.md` §Cross-feature dependencies

### complaints-refunds → payment-service

| Scenario | What to validate |
|---|---|
| Approve refund | POST /payments/orders/:ref/refund with refund_request_id |
| Unknown reference type | Returns error (no payment to refund) |
| Duplicate refund request | Returns existing Refund (idempotent) |

Source: `feature-complaints-refunds/design.md` §Endpoints

### order-delivery-schedule → direct-purchase + custom-quote

| Scenario | What to validate |
|---|---|
| DeliveryItem includes accepted orders | UNION query picks up orders with status=accepted |
| DeliveryItem includes paid quotes | UNION query picks up quotes with status=paid |
| DeliveryItem excludes non-deliverable | Orders in other statuses not included |

Source: `feature-order-delivery-schedule/design.md` §Unified projection model

### realtime-notifications → direct-purchase + custom-quote + complaints + supply

| Scenario | What to validate |
|---|---|
| New order triggers notification | notifyAdmins() called after order creation |
| New quote triggers notification | notifyAdmins() called after quote request |
| New complaint triggers notification | notifyAdmins() called after complaint submission |
| Low stock triggers notification | notifyAdmins() called by hourly job |

Source: `feature-realtime-notifications/tasks.md` §TASK-notif-6

## When to run these tests?

- **During development**: run against mocks (fast, no external deps)
- **Before PR**: run against mocks, all must pass
- **After dependency is merged**: optionally run against real service in
  docker-compose environment for end-to-end validation

## Common mistakes

1. **Testing the mock, not your code**: the mock is a tool, not the subject.
   Assert that YOUR feature handles the response correctly.
2. **Not testing error paths**: happy path is not enough. Test 500, timeout,
   unexpected format.
3. **Hardcoding mock responses**: use the contract from design.md. If the
   contract says the response has `payment_link`, mock that field.
4. **Forgetting idempotency**: financial operations must be idempotent. Test
   that sending the same request twice doesn't create duplicates.
