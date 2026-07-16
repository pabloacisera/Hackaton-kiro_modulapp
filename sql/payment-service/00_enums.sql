-- =============================================================================
-- ENUM TYPES FOR payment-service DATABASE
-- Separate database from api-core (Java/Spring Boot microservice)
-- =============================================================================

-- Required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment status flow: initiated -> confirmed/failed/refunded
CREATE TYPE payment_status AS ENUM (
    'initiated',
    'confirmed',
    'failed',
    'refunded'
);

-- Refund status
CREATE TYPE refund_status AS ENUM (
    'processed',
    'failed'
);

-- Receipt audience
CREATE TYPE receipt_audience AS ENUM (
    'customer',
    'admin'
);
