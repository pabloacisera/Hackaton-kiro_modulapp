# Hook: on-low-stock-minimum

**Trigger**: the hourly BullMQ stock check job (feature `feature-supply-stock-management`) detects a supply with current quantity below its configured `minimum_stock`.

**Actions the agent must execute automatically when generating/maintaining this code:**

1. The resulting notification is emitted via WebSocket to the admin dashboard, with non-intrusive sound (see `feature-realtime-notifications/design.md` for the sound asset and recommended volume/duration).
2. The notification **is not binding** — it must never block or pause sales automatically. It is purely informational so the admin can restock.
3. Must include: supply name, current quantity, configured minimum stock, and check timestamp.
4. The same supply must not be re-notified in each hourly run if it was already "viewed" by an admin and is still below minimum (avoid alert fatigue) — only re-notify if the quantity dropped further since the last notice, or 24 hours have passed since the last notice without restocking.
