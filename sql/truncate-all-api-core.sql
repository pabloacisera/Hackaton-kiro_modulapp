-- =============================================================================
-- truncate-all-api-core.sql
-- Limpia TODAS las tablas de la base de datos api-core.
-- Ejecutar ANTES de insertar el admin fundador.
-- USO: psql "$DATABASE_URL" -f sql/truncate-all-api-core.sql
-- =============================================================================

SET session_replication_role = replica;

TRUNCATE TABLE admin_notifications CASCADE;
TRUNCATE TABLE low_stock_alert_state CASCADE;
TRUNCATE TABLE supply_stock_change_log CASCADE;
TRUNCATE TABLE supplies CASCADE;
TRUNCATE TABLE complaints CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE proto_images CASCADE;
TRUNCATE TABLE prototypes CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE admin_users CASCADE;

SET session_replication_role = DEFAULT;

-- Verificación
SELECT 'admin_users' AS tabla, count(*) FROM admin_users
UNION ALL SELECT 'prototypes', count(*) FROM prototypes
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'quotes', count(*) FROM quotes
UNION ALL SELECT 'complaints', count(*) FROM complaints
UNION ALL SELECT 'supplies', count(*) FROM supplies
UNION ALL SELECT 'admin_notifications', count(*) FROM admin_notifications;
