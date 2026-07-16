-- =============================================================================
-- DELIVERY ITEMS VIEW
-- Read-only projection that unifies accepted orders and paid quotes
-- into a single delivery schedule view
-- =============================================================================

CREATE OR REPLACE VIEW delivery_items AS
SELECT
    o.id,
    'order'::delivery_origin AS origin,
    o.customer_name,
    o.customer_email,
    o.estimated_delivery_date,
    CASE
        WHEN o.estimated_delivery_date < CURRENT_DATE THEN 'overdue'
        WHEN o.delivered_at IS NOT NULL THEN 'delivered'
        ELSE 'pending'
    END AS status,
    o.delivered_at,
    o.created_at,
    o.deleted_at
FROM orders o
WHERE o.status = 'accepted'
  AND o.deleted_at IS NULL

UNION ALL

SELECT
    q.id,
    'quote'::delivery_origin AS origin,
    q.customer_name,
    q.customer_email,
    q.estimated_delivery_date,
    CASE
        WHEN q.estimated_delivery_date < CURRENT_DATE THEN 'overdue'
        ELSE 'pending'
    END AS status,
    NULL AS delivered_at,
    q.created_at,
    q.deleted_at
FROM quotes q
WHERE q.status = 'paid'
  AND q.deleted_at IS NULL;

COMMENT ON VIEW delivery_items IS 'Unified view of pending deliveries from orders (accepted) and quotes (paid)';
