-- =============================================================================
-- bootstrap-admin.sql
-- Inserta el administrador fundador en producción.
-- Ejecutar UNA SOLA VEZ después del truncate y antes de usar la app.
--
-- ANTES DE EJECUTAR:
--   1. Genera el hash con:
--      node -e "const argon2 = require('argon2'); argon2.hash('TU_PASSWORD').then(h => console.log(h))"
--   2. Reemplaza los placeholders abajo
--
-- USO: psql "$DATABASE_URL" -f sql/bootstrap-admin.sql
-- =============================================================================

INSERT INTO admin_users (id, email, password_hash, active, created_at)
VALUES (
  gen_random_uuid(),
  'admin@modulapp.com',                -- ← Cambia el email si lo deseas
  'REEMPLAZAR_CON_HASH_ARGON2',        -- ← Pega tu hash aquí
  true,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar inserción
SELECT id, email, active, created_at FROM admin_users;
