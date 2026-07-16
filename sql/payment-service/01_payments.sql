-- =============================================================================
-- PAYMENT TABLE
-- Payment records linked to orders/quotes from api-core
-- =============================================================================

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id        VARCHAR(255) NOT NULL,
    origin              payment_origin NOT NULL,
    amount_usd          DECIMAL(12,2) NOT NULL,
    status              payment_status NOT NULL DEFAULT 'initiated',
    paypal_order_id     VARCHAR(255) NOT NULL,
    idempotency_key     VARCHAR(255) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE payments IS 'Payment records for orders and quotes (cross-microservice with api-core)';
COMMENT ON COLUMN payments.reference_id IS 'Order ID or quote ID from api-core';
COMMENT ON COLUMN payments.origin IS 'Source entity type: order or quote';
COMMENT ON COLUMN payments.amount_usd IS 'Payment amount in USD';
COMMENT ON COLUMN payments.status IS 'Payment lifecycle: initiated, confirmed, failed, refunded';
COMMENT ON COLUMN payments.paypal_order_id IS 'PayPal Orders API ID';
COMMENT ON COLUMN payments.idempotency_key IS 'Unique idempotency key provided by api-core';
COMMENT ON COLUMN payments.created_at IS 'Payment creation timestamp';
COMMENT ON COLUMN payments.confirmed_at IS 'When payment was confirmed by PayPal webhook';
COMMENT ON COLUMN payments.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_payments_reference_id ON payments(reference_id);
CREATE INDEX idx_payments_status ON payments(status);
