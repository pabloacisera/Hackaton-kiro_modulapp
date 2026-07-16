-- =============================================================================
-- REFUND TABLE
-- Refund records linked to payments
-- =============================================================================

CREATE TABLE refunds (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id          UUID NOT NULL REFERENCES payments(id),
    refund_request_id   VARCHAR(255) NOT NULL UNIQUE,
    paypal_refund_id    VARCHAR(255) NOT NULL,
    reason              TEXT NOT NULL,
    status              refund_status NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE refunds IS 'Refund records for confirmed payments';
COMMENT ON COLUMN refunds.payment_id IS 'FK to the original payment';
COMMENT ON COLUMN refunds.refund_request_id IS 'Idempotency key from api-core (cross-microservice)';
COMMENT ON COLUMN refunds.paypal_refund_id IS 'PayPal Refunds API ID';
COMMENT ON COLUMN refunds.reason IS 'Reason for the refund';
COMMENT ON COLUMN refunds.status IS 'Refund status: processed or failed';
COMMENT ON COLUMN refunds.created_at IS 'Refund creation timestamp';
COMMENT ON COLUMN refunds.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
