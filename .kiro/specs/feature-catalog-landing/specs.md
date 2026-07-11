# Specs: Public catalog on landing

## What it is

Public showcase displaying modular furniture (MDF) prototypes and arches already quoted by the admin. It is the entry point for Flow A (direct purchase).

## Functional requirements

- FR1. List active prototypes with: image(s), name, short description, price (USD), available stock or status ("on order" if stock 0 but can be manufactured).
- FR2. Filter by category (furniture / arches) and by price range.
- FR3. Search by name/description.
- FR4. View prototype detail (gallery, specifications, estimated delivery time if available).
- FR5. "Buy" button that leads to Flow A (`feature-direct-purchase`).
- FR6. **Real-time sync (SSE)**: if the admin changes price, stock, or deactivates a prototype, the landing page reflects it without needing to reload, for any visitor with the page open at that moment.
- FR7. Visible access to "Request custom quote" (Flow B) and "Complaints and refunds" from any catalog section (persistent nav).

## Non-functional requirements

- Mobile-first, responsive.
- Must support es/en (see `feature-i18n-localization`).
- The displayed price must always be the current one at the time of initiating payment — buying with an outdated price on the client is not allowed (validate server-side anyway, SSE sync is UX, not the only security barrier).

## Edge cases

- A prototype is deactivated while a user has the detail page open → should show a "no longer available" notice via SSE, without allowing to proceed to buy.
- Stock reaches 0 while the user is in checkout → see `feature-direct-purchase` (stock reservation).
- SSE connection drops (unstable network) → automatic reconnection with backoff, without losing the last data snapshot displayed (show brief "updating...").

## Acceptance criteria

- Changing a price from the admin reflects on the landing page open on another device within 2 seconds.
- Search and filters work combined (search + category + price at the same time).
