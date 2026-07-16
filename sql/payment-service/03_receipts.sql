-- =============================================================================
-- RECEIPT TABLE
-- PDF receipts generated for payments and refunds
-- =============================================================================

CREATE TABLE receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id      UUID REFERENCES payments(id),
    refund_id       UUID REFERENCES refunds(id),
    audience        receipt_audience NOT NULL,
    pdf_url         VARCHAR(512) NOT NULL,
    sent_at         TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE receipts IS 'PDF receipts for payments and refunds, sent via email';
COMMENT ON COLUMN receipts.payment_id IS 'FK to the payment (null if receipt is for a refund)';
COMMENT ON COLUMN receipts.refund_id IS 'FK to the refund (null if receipt is for a payment)';
COMMENT ON COLUMN receipts.audience IS 'Receipt recipient: customer or admin';
COMMENT ON COLUMN receipts.pdf_url IS 'URL of the PDF stored in Supabase Storage';
COMMENT ON COLUMN receipts.sent_at IS 'When the receipt was sent via email';
COMMENT ON COLUMN receipts.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Constraint: a receipt must belong to either a payment or a refund, not both
ALTER TABLE receipts ADD CONSTRAINT chk_receipts_exclusive_fk
    CHECK (
        (payment_id IS NOT NULL AND refund_id IS NULL) OR
        (payment_id IS NULL AND refund_id IS NOT NULL)
    );

-- Indexes
CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_refund_id ON receipts(refund_id);
