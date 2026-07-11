## What it does

<!-- 1-3 lines explaining what this PR does -->

## Related task/issue

<!-- TASK-<feature>-<n> or FIX-ISSUE-<n> or "none" -->

## Risk level

<!-- Check ONE -->

- [ ] **Low** — docs, styles, types, typos, comments, README
- [ ] **Medium** — new feature, endpoint, business logic, job
- [ ] **High** — payments, security, DB migration, stock, refunds

## How to test it

<!-- Steps to verify this change works -->

1. 
2. 
3. 

## Screenshots (if frontend)

<!-- Mobile + Desktop screenshots required for UI changes -->

## Checklist

### General
- [ ] Resolves a single microtask/issue
- [ ] Variable names in English, clear
- [ ] Unit tests present (if business logic)
- [ ] Error handling present
- [ ] No secrets/keys leaked (only via `.env`)
- [ ] `design.md` updated (if API contract changed)
- [ ] Responsive/mobile-first verified (if frontend)

### Financial code (if applicable)
- [ ] Double reviewer required
- [ ] Idempotent operations
- [ ] PayPal failure path tested
- [ ] BigDecimal used (not float)
- [ ] Audit log present
- [ ] Receipt persisted before email

### Documentation
- [ ] Added line to `docs/collaboration-log.md`
- [ ] Updated `docs/feature-status.md` (if feature completed)

## Agent review request

<!-- Owner: comment "Review PR #N" to ask the agent to review -->
