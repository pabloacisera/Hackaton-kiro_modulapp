-- Flyway baseline migration for payment-service
-- Enables uuid_generate_v4() extension used by all subsequent migrations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
