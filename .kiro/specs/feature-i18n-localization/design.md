# Design: Internationalization (es/en)

## Frontend

- Library `react-i18next` (or `i18next` + `react-i18next`), translation files in `apps/landing/src/locales/{es,en}/common.json`.
- `controllers/useLocale.ts`: detects `navigator.language`, fallback `es`, persists selection in `localStorage`.
- Language selector in the header (persistent across the entire landing).

## Backend

- Each entity that triggers emails (`Order`, `Quote`, `Complaint`) adds a `locale: enum(es, en)` column, set at creation time from an `X-Locale` header (or body field) sent by the frontend in each public request.
- The `notifications-email` module in `api-core` uses language-specific templates (`templates/{es,en}/quote-sent.hbs`, etc. — Handlebars or similar) and always reads the `locale` persisted in the record, never the "current" language of the request that triggers the email in the future (e.g., the expiration job has no browser context, so it **must** use the saved field).

## Migration

Add `locale` to `orders`, `quotes`, `complaints` (default `es`).
