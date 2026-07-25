-- Ensure uuid extension is available (may have been skipped if baseline was applied)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE payment_origin  AS ENUM ('order', 'quote');
CREATE TYPE payment_status  AS ENUM ('initiated', 'confirmed', 'failed', 'refunded');
CREATE TYPE refund_status   AS ENUM ('processed', 'failed');
CREATE TYPE receipt_audience AS ENUM ('customer', 'admin');

-- =============================================================================
-- PAYMENTS
-- =============================================================================
CREATE TABLE payments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id     VARCHAR(255) NOT NULL,
    origin           payment_origin NOT NULL,
    amount_usd       DECIMAL(12,2) NOT NULL,
    status           payment_status NOT NULL DEFAULT 'initiated',
    paypal_order_id  VARCHAR(255) NOT NULL,
    idempotency_key  VARCHAR(255) NOT NULL UNIQUE,
    customer_email   VARCHAR(255) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at     TIMESTAMPTZ,
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_payments_reference_id ON payments(reference_id);
CREATE INDEX idx_payments_status       ON payments(status);

-- =============================================================================
-- REFUNDS
-- =============================================================================
CREATE TABLE refunds (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id         UUID NOT NULL REFERENCES payments(id),
    refund_request_id  VARCHAR(255) NOT NULL UNIQUE,
    paypal_refund_id   VARCHAR(255) NOT NULL,
    reason             TEXT NOT NULL,
    status             refund_status NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at         TIMESTAMPTZ
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);

-- =============================================================================
-- RECEIPTS
-- =============================================================================
CREATE TABLE receipts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id  UUID REFERENCES payments(id),
    refund_id   UUID REFERENCES refunds(id),
    audience    receipt_audience NOT NULL,
    pdf_url     VARCHAR(512) NOT NULL,
    sent_at     TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ,
    CONSTRAINT chk_receipts_exclusive_fk CHECK (
        (payment_id IS NOT NULL AND refund_id IS NULL) OR
        (payment_id IS NULL     AND refund_id IS NOT NULL)
    )
);

CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_refund_id  ON receipts(refund_id);

-- =============================================================================
-- AUDIT LOGS  (immutable — no UPDATE/DELETE granted here)
-- =============================================================================
CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor         VARCHAR(255) NOT NULL,
    action        VARCHAR(255) NOT NULL,
    reference_id  VARCHAR(255) NOT NULL,
    payload_json  TEXT NOT NULL,
    result        VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_reference_id ON audit_logs(reference_id);
CREATE INDEX idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at   ON audit_logs(created_at);
