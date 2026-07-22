-- =============================================================================
-- COMPLAINT TABLE
-- Customer complaints and refund requests
-- =============================================================================

CREATE TABLE complaints (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_type      complaint_reference_type NOT NULL,
    reference_id        UUID,
    customer_name       VARCHAR(255) NOT NULL,
    customer_email      VARCHAR(255) NOT NULL,
    customer_phone      VARCHAR(50),
    reason              TEXT NOT NULL,
    status              complaint_status NOT NULL DEFAULT 'received',
    resolution_notes    TEXT,
    refund_request_id   VARCHAR(255),
    locale              VARCHAR(10),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE complaints IS 'Customer complaints and refund requests';
COMMENT ON COLUMN complaints.reference_type IS 'Type of referenced entity: order, quote, or unknown';
COMMENT ON COLUMN complaints.reference_id IS 'FK to Order.id or Quote.id (null if reference_type=unknown)';
COMMENT ON COLUMN complaints.customer_name IS 'Customer full name';
COMMENT ON COLUMN complaints.customer_email IS 'Customer email';
COMMENT ON COLUMN complaints.customer_phone IS 'Customer phone (optional)';
COMMENT ON COLUMN complaints.reason IS 'Detailed reason for the complaint';
COMMENT ON COLUMN complaints.status IS 'Complaint lifecycle status';
COMMENT ON COLUMN complaints.resolution_notes IS 'Admin notes on how the complaint was resolved';
COMMENT ON COLUMN complaints.refund_request_id IS 'Idempotency key for payment-service refund';
COMMENT ON COLUMN complaints.locale IS 'Customer language: es or en';
COMMENT ON COLUMN complaints.created_at IS 'Complaint creation timestamp';
COMMENT ON COLUMN complaints.resolved_at IS 'When the complaint was resolved';
COMMENT ON COLUMN complaints.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_reference_id ON complaints(reference_id);
CREATE INDEX idx_complaints_customer_email ON complaints(customer_email);
CREATE INDEX idx_complaints_refund_request_id ON complaints(refund_request_id);
