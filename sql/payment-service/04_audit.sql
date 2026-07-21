-- =============================================================================
-- AUDIT LOG TABLE
-- Immutable audit trail for all payment-service operations
-- =============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor           VARCHAR(255) NOT NULL,
    action          VARCHAR(255) NOT NULL,
    reference_id    VARCHAR(255) NOT NULL,
    payload_json    TEXT NOT NULL,
    result          VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all payment-service operations';
COMMENT ON COLUMN audit_logs.actor IS 'Who performed the action (system, admin, webhook, etc.)';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.reference_id IS 'Reference to the affected entity';
COMMENT ON COLUMN audit_logs.payload_json IS 'JSON payload of the operation';
COMMENT ON COLUMN audit_logs.result IS 'Outcome of the operation';
COMMENT ON COLUMN audit_logs.created_at IS 'When the action occurred';
COMMENT ON COLUMN audit_logs.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_audit_logs_reference_id ON audit_logs(reference_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
