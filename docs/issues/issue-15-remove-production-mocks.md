# Issue #15: Remove all production mocks — wire real Redis + Mailjet

## Problem

Production code uses mocks/stubs instead of real implementations:

- REDIS_CLIENT in 2 modules → no-op stubs (cache broken, rate limiting disabled)
- 3 email services → log-only (customers never receive emails)
- 1 notification service → log-only (admins not notified of lockouts)
- 1 queue processor → log-only (queued emails silently dropped)
- Inconsistent Redis patterns across modules (3 different approaches)

## Impact

| Issue                                      | Severity       | Impact                                               |
| ------------------------------------------ | -------------- | ---------------------------------------------------- |
| Auth REDIS_CLIENT mock                     | 🔴 Security    | Rate limiting NEVER triggers — unlimited brute-force |
| Catalog REDIS_CLIENT mock                  | 🔴 Performance | Zero caching — every request hits DB                 |
| quote-email.service.ts (log-only)          | 🔴 Functional  | Flow B broken — no emails to customers               |
| complaint-email.service.ts (log-only)      | 🔴 Functional  | Complaints broken — no receipt/resolution emails     |
| lockout-notification.service.ts (log-only) | 🟡 Security    | Admins unaware of attacks                            |
| email-send.processor.ts (log-only)         | 🟡 Functional  | BullMQ email queue silently drops jobs               |
| supplies REDIS_CLIENT Map fallback         | 🟡 Reliability | Silent degradation if env vars missing               |

## Plan of action

### Task 1: Shared RedisModule (replaces all 3 REDIS_CLIENT patterns)

Create `apps/api-core/src/infrastructure/redis/redis.module.ts`:

- Single Upstash Redis factory (same pattern as supplies but without fallback)
- Fail-fast if credentials missing in production
- Export `REDIS_CLIENT` token
- Import in: CatalogModule, AuthModule, SuppliesModule (remove their local providers)

### Task 2: Wire email services to Mailjet

- QuoteEmailService: inject HttpService, use same `send()` pattern as OrderEmailService
- ComplaintEmailService: inject HttpService, use same `send()` pattern
- EmailSendProcessor: inject a shared MailjetService (or HttpService directly)

### Task 3: Wire lockout notification

- LockoutNotificationService: inject NotificationsService, call `notifyAdmins()`

### Task 4: Remove supplies Map fallback

- Remove the in-memory Map fallback from SuppliesModule
- Use the shared RedisModule instead

### Task 5: Fix CatalogModule wiring

- Remove manual JwtService/Reflector providers
- Import AuthModule instead (proper dependency)

### Task 6: Verify BullMQ connection end-to-end

- Confirm queue.module.ts registers correctly with real Redis
- Confirm scheduled jobs processor fires
- Confirm no stale setInterval remains

## Acceptance criteria

- Zero mock/stub providers in any `.module.ts` file (except test files)
- All email services call Mailjet API (with graceful skip if credentials missing in dev)
- Rate limiting works with real Redis
- Catalog cache works with real Redis
- BullMQ connects to Redis and registers repeatable jobs
- All existing tests pass (mocks in test files are fine)
