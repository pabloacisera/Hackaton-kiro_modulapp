-- =============================================================================
-- QUOTE TABLE
-- Custom quote requests (Flow B)
-- =============================================================================

CREATE TABLE quotes (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name               VARCHAR(255) NOT NULL,
    customer_email              VARCHAR(255) NOT NULL,
    customer_phone              VARCHAR(50) NOT NULL,
    description                 TEXT NOT NULL,
    needed_by_date              DATE NOT NULL,
    status                      quote_status NOT NULL DEFAULT 'pending',
    quoted_price_usd            DECIMAL(10,2),
    quoted_lead_time_days       INTEGER,
    estimated_delivery_date     DATE,
    quote_sent_at               TIMESTAMPTZ,
    quote_response_deadline     TIMESTAMPTZ,
    payment_deadline            TIMESTAMPTZ,
    accepted_at                 TIMESTAMPTZ,
    rejected_at                 TIMESTAMPTZ,
    paid_at                     TIMESTAMPTZ,
    rejection_reason            TEXT,
    action_token_hash           VARCHAR(255),
    action_token_used           BOOLEAN NOT NULL DEFAULT false,
    payment_service_ref         VARCHAR(255),
    locale                      VARCHAR(10),
    deleted_at                  TIMESTAMPTZ
);

COMMENT ON TABLE quotes IS 'Custom quote requests from customers (Flow B)';
COMMENT ON COLUMN quotes.customer_name IS 'Customer full name';
COMMENT ON COLUMN quotes.customer_email IS 'Customer email (no accounts)';
COMMENT ON COLUMN quotes.customer_phone IS 'Customer phone number';
COMMENT ON COLUMN quotes.description IS 'Customer description of what they need';
COMMENT ON COLUMN quotes.needed_by_date IS 'When the customer needs the product';
COMMENT ON COLUMN quotes.status IS 'Quote lifecycle status';
COMMENT ON COLUMN quotes.quoted_price_usd IS 'Price quoted by admin (set when quoting)';
COMMENT ON COLUMN quotes.quoted_lead_time_days IS 'Manufacturing lead time in days';
COMMENT ON COLUMN quotes.estimated_delivery_date IS 'Estimated delivery date (set by admin)';
COMMENT ON COLUMN quotes.quote_sent_at IS 'When the quote was sent to the customer';
COMMENT ON COLUMN quotes.quote_response_deadline IS 'quote_sent_at + 48h: auto-expire if no response';
COMMENT ON COLUMN quotes.payment_deadline IS 'accepted_at + 24h: auto-expire if no payment';
COMMENT ON COLUMN quotes.accepted_at IS 'When the customer accepted the quote';
COMMENT ON COLUMN quotes.rejected_at IS 'When the customer rejected the quote';
COMMENT ON COLUMN quotes.paid_at IS 'When payment was confirmed';
COMMENT ON COLUMN quotes.rejection_reason IS 'Reason if system discarded (incomplete data)';
COMMENT ON COLUMN quotes.action_token_hash IS 'Hash of the JWT token for accept/reject actions';
COMMENT ON COLUMN quotes.action_token_used IS 'Whether the action token has been consumed';
COMMENT ON COLUMN quotes.payment_service_ref IS 'Payment reference from payment-service';
COMMENT ON COLUMN quotes.locale IS 'Customer language: es or en';
COMMENT ON COLUMN quotes.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX idx_quotes_payment_service_ref ON quotes(payment_service_ref);
CREATE INDEX idx_quotes_action_token_hash ON quotes(action_token_hash);
