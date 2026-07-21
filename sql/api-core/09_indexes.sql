-- =============================================================================
-- ADDITIONAL INDEXES
-- Performance indexes for common query patterns
-- =============================================================================

-- Composite index for the delivery_items view performance
CREATE INDEX idx_orders_status_estimated_delivery ON orders(status, estimated_delivery_date)
    WHERE status = 'accepted' AND deleted_at IS NULL;

CREATE INDEX idx_quotes_status_estimated_delivery ON quotes(status, estimated_delivery_date)
    WHERE status = 'paid' AND deleted_at IS NULL;

-- Index for hourly low-stock check job
CREATE INDEX idx_supplies_low_stock ON supplies(current_qty, min_stock)
    WHERE deleted_at IS NULL;

-- Index for quote expiration job (BullMQ scheduled task)
CREATE INDEX idx_quotes_pending_expiration ON quotes(status, quote_response_deadline)
    WHERE status IN ('pending', 'quoted') AND deleted_at IS NULL;

CREATE INDEX idx_quotes_payment_expiration ON quotes(status, payment_deadline)
    WHERE status = 'accepted' AND deleted_at IS NULL;

-- Index for active admin users lookup
CREATE INDEX idx_admin_users_active ON admin_users(active)
    WHERE deleted_at IS NULL;
