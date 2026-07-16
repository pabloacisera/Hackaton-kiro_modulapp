-- =============================================================================
-- ORDER TABLE
-- Direct purchase orders (Flow A)
-- =============================================================================

CREATE TABLE orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prototype_id            UUID NOT NULL REFERENCES prototypes(id),
    price_usd_snapshot      DECIMAL(10,2) NOT NULL,
    customer_email          VARCHAR(255) NOT NULL,
    customer_name           VARCHAR(255),
    status                  order_status NOT NULL DEFAULT 'created',
    rejection_reason        TEXT,
    estimated_delivery_date DATE,
    payment_service_ref     VARCHAR(255) NOT NULL,
    locale                  VARCHAR(10),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

COMMENT ON TABLE orders IS 'Direct purchase orders from the catalog (Flow A)';
COMMENT ON COLUMN orders.prototype_id IS 'FK to the purchased prototype';
COMMENT ON COLUMN orders.price_usd_snapshot IS 'Price captured server-side at payment time';
COMMENT ON COLUMN orders.customer_email IS 'Customer email (no accounts — identity via email)';
COMMENT ON COLUMN orders.customer_name IS 'Optional customer name';
COMMENT ON COLUMN orders.status IS 'Order lifecycle status';
COMMENT ON COLUMN orders.rejection_reason IS 'Reason if admin rejects the order';
COMMENT ON COLUMN orders.estimated_delivery_date IS 'Set when admin accepts the order';
COMMENT ON COLUMN orders.payment_service_ref IS 'Transaction reference from payment-service';
COMMENT ON COLUMN orders.locale IS 'Customer language: es or en';
COMMENT ON COLUMN orders.created_at IS 'Order creation timestamp';
COMMENT ON COLUMN orders.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN orders.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_orders_prototype_id ON orders(prototype_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_payment_service_ref ON orders(payment_service_ref);
