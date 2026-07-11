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
