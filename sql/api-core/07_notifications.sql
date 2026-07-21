-- =============================================================================
-- ADMIN NOTIFICATION TABLE
-- Real-time notifications for the admin dashboard (polymorphic references)
-- =============================================================================

CREATE TABLE admin_notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            notification_type NOT NULL,
    message         VARCHAR(512) NOT NULL,
    reference_type  notification_reference_type NOT NULL,
    reference_id    UUID NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE admin_notifications IS 'Real-time notifications displayed in the admin dashboard';
COMMENT ON COLUMN admin_notifications.type IS 'Notification type: new_order, new_quote, new_complaint, low_stock, payment_confirmed';
COMMENT ON COLUMN admin_notifications.message IS 'Short human-readable notification message';
COMMENT ON COLUMN admin_notifications.reference_type IS 'Type of referenced entity: order, quote, complaint, supply';
COMMENT ON COLUMN admin_notifications.reference_id IS 'ID of the referenced entity (polymorphic)';
COMMENT ON COLUMN admin_notifications.read IS 'Whether the admin has read this notification';
COMMENT ON COLUMN admin_notifications.created_at IS 'Notification creation timestamp';
COMMENT ON COLUMN admin_notifications.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX idx_admin_notifications_reference ON admin_notifications(reference_type, reference_id);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at);
