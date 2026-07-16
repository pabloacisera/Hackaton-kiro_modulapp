-- =============================================================================
-- SUPPLY TABLES
-- Supply, SupplyStockChangeLog, and LowStockAlertState for inventory management
-- =============================================================================

CREATE TABLE supplies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    unit            supply_unit NOT NULL,
    current_qty     DECIMAL(12,4) NOT NULL DEFAULT 0,
    min_stock       DECIMAL(12,4) NOT NULL DEFAULT 0,
    unit_cost_usd   DECIMAL(10,4) NOT NULL,
    supplier        VARCHAR(255),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE supplies IS 'Raw materials and supplies used in manufacturing';
COMMENT ON COLUMN supplies.sku IS 'Unique stock-keeping unit identifier';
COMMENT ON COLUMN supplies.name IS 'Human-readable supply name';
COMMENT ON COLUMN supplies.unit IS 'Unit of measure: unit, m2, kg, sheet, meter, kilogram';
COMMENT ON COLUMN supplies.current_qty IS 'Current quantity in stock';
COMMENT ON COLUMN supplies.min_stock IS 'Minimum stock threshold before low-stock alert';
COMMENT ON COLUMN supplies.unit_cost_usd IS 'Cost per unit in USD';
COMMENT ON COLUMN supplies.supplier IS 'Supplier name (optional)';
COMMENT ON COLUMN supplies.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN supplies.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

CREATE TABLE supply_stock_change_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_id       UUID NOT NULL REFERENCES supplies(id),
    previous_qty    DECIMAL(12,4) NOT NULL,
    new_qty         DECIMAL(12,4) NOT NULL,
    source          stock_change_source NOT NULL,
    actor           VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE supply_stock_change_logs IS 'Audit log for all supply stock changes';
COMMENT ON COLUMN supply_stock_change_logs.supply_id IS 'FK to the affected supply';
COMMENT ON COLUMN supply_stock_change_logs.previous_qty IS 'Stock quantity before the change';
COMMENT ON COLUMN supply_stock_change_logs.new_qty IS 'Stock quantity after the change';
COMMENT ON COLUMN supply_stock_change_logs.source IS 'Change source: manual, excel_import, or order_consumption';
COMMENT ON COLUMN supply_stock_change_logs.actor IS 'Who/what triggered the change';
COMMENT ON COLUMN supply_stock_change_logs.created_at IS 'Timestamp of the change';
COMMENT ON COLUMN supply_stock_change_logs.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

CREATE TABLE low_stock_alert_states (
    supply_id           UUID PRIMARY KEY REFERENCES supplies(id),
    last_notified_at    TIMESTAMPTZ,
    last_notified_qty   DECIMAL(12,4),
    deleted_at          TIMESTAMPTZ
);

COMMENT ON TABLE low_stock_alert_states IS 'Tracks last notification state for low-stock alerts per supply';
COMMENT ON COLUMN low_stock_alert_states.supply_id IS 'FK to the supply (1:1 relationship)';
COMMENT ON COLUMN low_stock_alert_states.last_notified_at IS 'When the last low-stock notification was sent';
COMMENT ON COLUMN low_stock_alert_states.last_notified_qty IS 'Stock level at the time of last notification';
COMMENT ON COLUMN low_stock_alert_states.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_supply_stock_change_logs_supply_id ON supply_stock_change_logs(supply_id);
