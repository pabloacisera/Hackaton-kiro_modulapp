# Specs: Admin auth and base dashboard layout

## Functional requirements

- FR1. Admin login with email + password (proprietary JWT, no customer account involved — this login is exclusive to the internal dashboard).
- FR2. Multiple admins can exist, all with the same permissions (no differentiated roles for now).
- FR3. Basic admin management: create (by another logged-in admin), deactivate, password change.
- FR4. Base dashboard layout: navigation to sections (catalog, purchases/orders, quotes, stock/supplies, complaints/refunds, notifications), responsive.
- FR5. Session expires (refresh token) and explicit logout.

## Non-functional requirements

- Passwords hashed (bcrypt/argon2), never stored in plain text or logged.
- Rate limiting on the login endpoint (brute force mitigation).
- All dashboard routes (except login) require a valid JWT.

## Edge cases

- Token expires while admin has the dashboard open → silent refresh; if the refresh also expired, redirect to login without losing the draft of what they were working on if possible (e.g., half-filled quote form, saved in local state before redirecting).
- Repeated failed login attempts → temporary lockout + notification.

## Acceptance criteria

- No admin endpoint returns data without a valid JWT.
- A deactivated admin cannot log in even with the correct password.
