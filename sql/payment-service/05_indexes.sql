-- =============================================================================
-- ADDITIONAL INDEXES FOR payment-service
-- Performance indexes for common query patterns
-- =============================================================================

-- Index for webhook processing: find payment by PayPal order ID
CREATE INDEX idx_payments_paypal_order_id ON payments(paypal_order_id);

-- Index for cross-microservice lookup by origin + reference_id
CREATE INDEX idx_payments_origin_reference ON payments(origin, reference_id);

-- Index for receipt generation after payment confirmation
CREATE INDEX idx_receipts_audience ON receipts(audience);
