-- =============================================================================
-- ADMIN AUTH TABLES
-- AdminUser and RefreshToken for admin authentication
-- =============================================================================

CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE admin_users IS 'Admin users for dashboard authentication';
COMMENT ON COLUMN admin_users.email IS 'Unique email address used as login identifier';
COMMENT ON COLUMN admin_users.password_hash IS 'Argon2 hashed password';
COMMENT ON COLUMN admin_users.active IS 'Whether the admin account is active';
COMMENT ON COLUMN admin_users.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id   UUID NOT NULL REFERENCES admin_users(id),
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for admin JWT authentication';
COMMENT ON COLUMN refresh_tokens.admin_user_id IS 'FK to the admin user who owns this token';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of the refresh token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Whether this token has been revoked';
COMMENT ON COLUMN refresh_tokens.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_refresh_tokens_admin_user_id ON refresh_tokens(admin_user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
