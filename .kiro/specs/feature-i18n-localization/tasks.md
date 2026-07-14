# Tasks: Internationalization (es/en)

- [ ] TASK-i18n-1: Setup `react-i18next` in `apps/landing` + translation file structure
  - Context: FR1 — landing page must support es/en. Foundation for all frontend i18n work. Installs react-i18next, configures i18next instance, creates `public/locales/es/common.json` and `public/locales/en/common.json` with initial empty structure.
  - Deliverable: `apps/landing/src/i18n.ts`, `apps/landing/public/locales/es/common.json`, `apps/landing/public/locales/en/common.json`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `i18n.ts` exports initialized i18next instance with es as default lang and `es`/`en` namespaces loaded. `app.tsx` (or entry point) imports `./i18n`. Translation files exist and are valid JSON. App boots without errors in both locales.

- [ ] TASK-i18n-2: `controllers/useLocale.ts` (detection + persistence)
  - Context: FR1 — default Spanish, detected by `Accept-Language`, persisted in `localStorage`. Manual override must persist. Subfield "submit time" locale wins over initial load.
  - Deliverable: `apps/landing/src/hooks/useLocale.ts`, `apps/landing/src/hooks/__tests__/useLocale.spec.ts`
  - Depends on: TASK-i18n-1
  - Assigned to: unassigned
  - Done criteria: Hook reads `navigator.language` on first load and defaults to `'es'` when no match. Writes selected locale to `localStorage` key `locale`. On subsequent loads reads from `localStorage`. Exposes `setLocale(lang)` that updates both state and `localStorage`. Unit tests pass: fallback to Spanish when no header, respects Accept-Language, saves to localStorage, manual override persists.

- [ ] TASK-i18n-3: Language selector in landing header
  - Context: FR1 — visible language selector in the landing page header.
  - Deliverable: `apps/landing/src/components/Header/LanguageSelector.tsx`, `apps/landing/src/components/Header/__tests__/LanguageSelector.spec.tsx`
  - Depends on: TASK-i18n-2
  - Assigned to: unassigned
  - Done criteria: Renders two buttons/links (ES / EN). Clicking one calls `setLocale` from `useLocale` and switches i18next language. Active locale is visually highlighted. Unit tests render both options, simulate click, verify `setLocale` called with correct value and i18next language updated.

- [ ] TASK-i18n-4: Migration: add `locale` column to `orders`, `quotes`, `complaints`
  - Context: FR2/NFR — the language chosen at submit time must be saved with the record so future emails are consistent.
  - Deliverable: `services/api-core/src/migrations/<timestamp>_add_locale_to_records.ts`
  - Depends on: none (independent of frontend tasks; depends on existing table migrations from direct-purchase, quoteB, complaint features being in place)
  - Assigned to: unassigned
  - Done criteria: Migration adds `locale VARCHAR(5)` column with default `'es'` to `orders`, `quotes`, and `complaints` tables. Rollback drops the columns. Existing rows retain `'es'`. Migration runs cleanly on fresh and populated databases.

- [ ] TASK-i18n-5: Middleware/decorator reads `X-Locale` header and persists to record
  - Context: FR2/NFR — the locale from the HTTP request (`X-Locale` header) must be saved into the record at creation time (submit time), not at initial form load.
  - Deliverable: `services/api-core/src/common/decorators/set-locale.decorator.ts`, `services/api-core/src/common/decorators/__tests__/set-locale.decorator.spec.ts`
  - Depends on: TASK-i18n-4
  - Assigned to: unassigned
  - Done criteria: Decorator/middleware extracts `X-Locale` from request headers, validates it against `['es','en']`, defaults to `'es'` if missing/invalid, and writes it to the record's `locale` field before persisting. Unit tests pass: reads X-Locale header, falls back to Spanish when header absent, rejects invalid locale values, persists to record entity.

- [ ] TASK-i18n-6a: Email templates (purchase flow) in es/en — confirmation + receipt
  - Context: FR2 — transactional emails for purchase flow (confirmation, payment receipt) must be sent in the customer's language.
  - Deliverable: `services/api-core/src/modules/notifications-email/templates/es/purchase-confirmation.hbs`, `services/api-core/src/modules/notifications-email/templates/en/purchase-confirmation.hbs`, `services/api-core/src/modules/notifications-email/templates/es/purchase-receipt.hbs`, `services/api-core/src/modules/notifications-email/templates/en/purchase-receipt.hbs`, `services/api-core/src/modules/notifications-email/templates/__tests__/purchase-templates.spec.ts`
  - Depends on: TASK-i18n-4
  - Assigned to: unassigned
  - Done criteria: Four Handlebars templates exist (2 templates x 2 languages). Each template compiles without errors when given sample order data. Unit tests verify: Spanish template renders Spanish text for es locale, English template renders English text for en locale, no mixed-language output within a single template render.

- [ ] TASK-i18n-6b: Email templates (quote/complaint flow) in es/en — quote sent, acceptance, rejection, postponement, expiration, complaint receipt
  - Context: FR2 — transactional emails for quote and complaint flows must be sent in the customer's language.
  - Deliverable: `services/api-core/src/modules/notifications-email/templates/es/quote-sent.hbs`, `services/api-core/src/modules/notifications-email/templates/en/quote-sent.hbs`, `services/api-core/src/modules/notifications-email/templates/es/quote-acceptance.hbs`, `services/api-core/src/modules/notifications-email/templates/en/quote-acceptance.hbs`, `services/api-core/src/modules/notifications-email/templates/es/quote-rejection.hbs`, `services/api-core/src/modules/notifications-email/templates/en/quote-rejection.hbs`, `services/api-core/src/modules/notifications-email/templates/es/quote-postponement.hbs`, `services/api-core/src/modules/notifications-email/templates/en/quote-postponement.hbs`, `services/api-core/src/modules/notifications-email/templates/es/quote-expiration.hbs`, `services/api-core/src/modules/notifications-email/templates/en/quote-expiration.hbs`, `services/api-core/src/modules/notifications-email/templates/es/complaint-receipt.hbs`, `services/api-core/src/modules/notifications-email/templates/en/complaint-receipt.hbs`, `services/api-core/src/modules/notifications-email/templates/__tests__/quote-complaint-templates.spec.ts`
  - Depends on: TASK-i18n-4
  - Assigned to: unassigned
  - Done criteria: Twelve Handlebars templates exist (6 templates x 2 languages). Each template compiles without errors with sample data. Unit tests verify: each Spanish template renders Spanish text, each English template renders English text, no mixed-language output within a single template render.

- [ ] TASK-i18n-7: `notifications-email` module selects template based on record `locale`
  - Context: FR2/NFR — emails must use the locale saved on the record, not the locale of the current request/session that triggers sending (edge case: admin quotes an English-created quote → email goes in English).
  - Deliverable: `services/api-core/src/modules/notifications-email/notifications-email.service.ts` (modify), `services/api-core/src/modules/notifications-email/__tests__/template-selection.spec.ts`
  - Depends on: TASK-i18n-6a, TASK-i18n-6b
  - Assigned to: unassigned
  - Done criteria: Service reads `record.locale` (not request locale) to resolve template path (`<template-name>.<locale>.hbs`). Falls back to `'es'` if locale field is missing. Unit tests pass: uses record locale for template selection, falls back to Spanish when record locale is null/undefined, English template selected for record with locale `'en'`, Spanish template selected for record with locale `'es'`.

- [ ] TASK-i18n-8: Complete translation of landing UI texts (es/en)
  - Context: FR1 — full landing page (catalog, quote forms, complaints, checkout) must be translated.
  - Deliverable: `apps/landing/public/locales/es/common.json`, `apps/landing/public/locales/en/common.json`
  - Depends on: TASK-i18n-1
  - Assigned to: unassigned
  - Done criteria: All visible UI strings in catalog, quote form, complaint form, checkout, and header/footer use `t('key')` calls. Both `es/common.json` and `en/common.json` contain complete translations for every key. Switching locale via selector updates all visible text without page reload. No hardcoded user-facing strings remain in component files.

- [ ] TASK-i18n-integration: Integration tests for locale across all flows
  - Context: Validates end-to-end that locale is persisted with each record type (Order, Quote, Complaint) and that email templates are selected by the record's locale, not the current request. Covers edge case: admin triggers email for record created in a different locale.
  - Deliverable: `services/api-core/src/modules/**/locale-flow.integration-spec.ts`
  - Depends on: TASK-i18n-5, TASK-i18n-7
  - Assigned to: unassigned
  - Done criteria: Supertest tests with mocked Mailjet pass: `integration.i18n.orderCreation.persistsLocale`, `integration.i18n.quoteCreation.persistsLocale`, `integration.i18n.complaintCreation.persistsLocale`, `integration.i18n.emailTemplateSelection.usesRecordLocaleNotRequestLocale`, `integration.i18n.emailTemplate.spanishTemplateForEsLocale`, `integration.i18n.emailTemplate.englishTemplateForEnLocale`. All green.
