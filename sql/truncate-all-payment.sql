-- =============================================================================
-- truncate-all-payment.sql
-- Limpia TODAS las tablas de la base de datos payment-service.
-- USO: psql "$PAYMENT_DATABASE_URL" -f sql/truncate-all-payment.sql
-- =============================================================================

SET session_replication_role = replica;

TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE refunds CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

SET session_replication_role = DEFAULT;

-- Verificación
SELECT 'payments' AS tabla, count(*) FROM payments
UNION ALL SELECT 'refunds', count(*) FROM refunds
UNION ALL SELECT 'receipts', count(*) FROM receipts
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
