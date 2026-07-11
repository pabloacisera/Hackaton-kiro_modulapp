# Specs: Internationalization (es/en)

## Functional requirements

- FR1. Complete landing page (catalog, quote forms, complaints, checkout) available in Spanish and English, with visible language selector.
- FR2. Transactional emails (payment confirmation, quotes, receipts, expiration notices, etc.) are sent in the language detected/chosen by the customer at the time of the request.
- FR3. The admin panel can remain in Spanish only (internal use) — not a requirement of this feature, only the landing and customer emails.

## Non-functional requirements

- Default language: Spanish. Detected by browser preference (`Accept-Language`) with fallback to Spanish, and the customer can change it manually (persisted in landing `localStorage`).
- The language chosen in a request (quote, complaint, purchase) is saved with the record so that **all** future emails for that same process (including the quote, acceptance, receipt) come out consistent in that language, regardless of the browser session at that future time.

## Edge cases

- Customer changes the landing language midway through filling out the quote form → the language saved is the one in effect at `submit` time, not the initial one.
- An admin quotes a quote that was created in English → the quote email goes out in English anyway, without the admin needing to choose anything.

## Acceptance criteria

- No transactional email of the same process mixes languages with each other.
