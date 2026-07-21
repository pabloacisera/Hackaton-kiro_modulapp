-- =============================================================================
-- ENUM TYPES FOR api-core DATABASE
-- PostgreSQL (Supabase)
-- =============================================================================

-- Required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prototype categories
CREATE TYPE prototype_category AS ENUM (
    'modular_furniture',
    'arches'
);

-- Order status flow: created -> payment_initiated -> paid_pending_acceptance -> accepted/rejected/payment_failed
CREATE TYPE order_status AS ENUM (
    'created',
    'payment_initiated',
    'paid_pending_acceptance',
    'accepted',
    'rejected',
    'payment_failed'
);

-- Quote status flow: pending -> quoted -> accepted -> payment_initiated -> paid
CREATE TYPE quote_status AS ENUM (
    'pending',
    'quoted',
    'accepted',
    'rejected',
    'expired',
    'payment_initiated',
    'paid',
    'payment_expired',
    'archived'
);

-- Complaint status
CREATE TYPE complaint_status AS ENUM (
    'received',
    'under_review',
    'refund_approved',
    'resolved_other_way',
    'rejected'
);

-- Complaint reference type (polymorphic)
CREATE TYPE complaint_reference_type AS ENUM (
    'order',
    'quote',
    'unknown'
);

-- Supply units of measure
CREATE TYPE supply_unit AS ENUM (
    'unit',
    'm2',
    'kg',
    'sheet',
    'meter',
    'kilogram'
);

-- Stock change log source
CREATE TYPE stock_change_source AS ENUM (
    'manual',
    'excel_import',
    'order_consumption'
);

-- Admin notification type
CREATE TYPE notification_type AS ENUM (
    'new_order',
    'new_quote',
    'new_complaint',
    'low_stock',
    'payment_confirmed'
);

-- Admin notification reference type (polymorphic)
CREATE TYPE notification_reference_type AS ENUM (
    'order',
    'quote',
    'complaint',
    'supply'
);

-- Delivery item origin (for the view)
CREATE TYPE delivery_origin AS ENUM (
    'order',
    'quote'
);
