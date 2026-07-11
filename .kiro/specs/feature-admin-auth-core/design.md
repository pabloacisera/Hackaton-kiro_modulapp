# Design: Admin auth and base dashboard layout

## Data model

```
AdminUser {
  id: uuid
  email: string (unique)
  password_hash: string
  active: boolean
  created_at, last_login_at
}
RefreshToken {
  id, admin_user_id, token_hash, expires_at, revoked: boolean
}
```

## Endpoints

- `POST /api/admin/auth/login` `{ email, password }` → access JWT (short-lived, ~15min) + refresh token (httpOnly cookie, long-lived).
- `POST /api/admin/auth/refresh` → new access JWT if refresh is valid and not revoked.
- `POST /api/admin/auth/logout` → revokes the refresh token.
- `POST /api/admin/users` (requires JWT) → create new admin.
- `PATCH /api/admin/users/:id/deactivate`.

## Frontend (apps/admin-dashboard)

- `views/LoginPage`, `controllers/useAuth.ts` (manages access token in memory, automatic refresh via HTTP interceptor).
- `views/DashboardLayout` with side nav to sections + notification zone (badge + panel, see `feature-realtime-notifications`).
- Route guard: no valid JWT → redirect to `/login`.

## Security

- Rate limit on `/login` (e.g., 5 attempts / 15 min per IP+email via Redis).
- CORS restricted to the admin-dashboard domain itself.
