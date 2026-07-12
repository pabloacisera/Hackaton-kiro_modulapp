# Tasks: Internationalization (es/en)

- [ ] TASK-i18n-1: Setup `react-i18next` in `apps/landing` + translation file structure
- [ ] TASK-i18n-2: `controllers/useLocale.ts` (detection + persistence)
  - Depends on: TASK-i18n-1
- [ ] TASK-i18n-3: Language selector in landing header
  - Depends on: TASK-i18n-2
- [ ] TASK-i18n-4: Migration: add `locale` column to `orders`, `quotes`, `complaints`
  - Depends on: TASK-directpurchase-1, TASK-quoteB-1, TASK-complaint-1
- [ ] TASK-i18n-5: Middleware/decorator that reads `X-Locale` header in public endpoints and persists it when creating the record
  - Depends on: TASK-i18n-4
- [ ] TASK-i18n-6: Email templates in es/en for: purchase confirmation, quote sent, acceptance/rejection, payment receipt, complaint receipt, expiration notice, postponement
  - Depends on: TASK-i18n-4
- [ ] TASK-i18n-7: `notifications-email` module selects template based on record `locale` (not the request that triggers sending)
  - Depends on: TASK-i18n-6
- [ ] TASK-i18n-8: Complete translation of landing UI texts (es/en)
  - Depends on: TASK-i18n-1

- [ ] TASK-i18n-test1: Unit tests for locale detection and persistence logic
  - Context: useLocale hook must detect Accept-Language, persist to localStorage, and the middleware must read X-Locale header and persist to record. Must test: fallback to Spanish when no header, manual override persistence, locale saved at submit time not initial load.
  - Deliverable: `services/api-core/src/modules/**/locale*.spec.ts` + `apps/landing/src/**/__tests__/useLocale.spec.ts`
  - Depends on: TASK-i18n-7
  - Assigned to: unassigned
  - Done criteria: unit.locale.detection.fallbackToSpanish, unit.locale.detection.respectsAcceptLanguage, unit.locale.persistence.savesToLocalStorage, unit.locale.middleware.readsXLocaleHeader, unit.locale.middleware.persistsToRecord. All pass.

- [ ] TASK-i18n-test2: Integration tests for locale across flows
  - Context: validates that locale is persisted with each record (Order, Quote, Complaint) and that email templates are selected by the record's locale, not the current request. Uses Supertest with mocked Mailjet.
  - Deliverable: `services/api-core/src/modules/**/locale*.integration-spec.ts`
  - Depends on: TASK-i18n-test1
  - Assigned to: unassigned
  - Done criteria: integration.i18n.orderCreation.persistsLocale, integration.i18n.quoteCreation.persistsLocale, integration.i18n.complaintCreation.persistsLocale, integration.i18n.emailTemplateSelection.usesRecordLocaleNotRequestLocale, integration.i18n.emailTemplate.spanishTemplateForEsLocale, integration.i18n.emailTemplate.englishTemplateForEnLocale. All pass.
