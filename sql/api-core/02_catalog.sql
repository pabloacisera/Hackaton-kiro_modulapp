-- =============================================================================
-- CATALOG TABLES
-- Prototype and ProtoImage for the public product catalog
-- =============================================================================

CREATE TABLE prototypes (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    category                prototype_category NOT NULL,
    price_usd               DECIMAL(10,2) NOT NULL,
    active                  BOOLEAN NOT NULL DEFAULT true,
    stock_qty               INTEGER NOT NULL DEFAULT 0,
    build_on_demand         BOOLEAN NOT NULL DEFAULT false,
    estimated_delivery_days INTEGER,
    deleted_at              TIMESTAMPTZ
);

COMMENT ON TABLE prototypes IS 'Product prototypes (modular furniture and arches)';
COMMENT ON COLUMN prototypes.name IS 'Display name of the prototype';
COMMENT ON COLUMN prototypes.description IS 'Detailed product description';
COMMENT ON COLUMN prototypes.category IS 'Product category: modular_furniture or arches';
COMMENT ON COLUMN prototypes.price_usd IS 'Price in USD';
COMMENT ON COLUMN prototypes.active IS 'Whether the prototype is visible in the public catalog';
COMMENT ON COLUMN prototypes.stock_qty IS 'Current finished product stock count';
COMMENT ON COLUMN prototypes.build_on_demand IS 'If true, can be manufactured even when stock=0';
COMMENT ON COLUMN prototypes.estimated_delivery_days IS 'Estimated days for delivery';
COMMENT ON COLUMN prototypes.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

CREATE TABLE proto_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prototype_id    UUID NOT NULL REFERENCES prototypes(id),
    url             VARCHAR(512) NOT NULL,
    "order"         INTEGER NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE proto_images IS 'Images associated with product prototypes';
COMMENT ON COLUMN proto_images.prototype_id IS 'FK to the parent prototype';
COMMENT ON COLUMN proto_images.url IS 'Image URL (Supabase Storage or CDN)';
COMMENT ON COLUMN proto_images."order" IS 'Display order (lower = shown first)';
COMMENT ON COLUMN proto_images.deleted_at IS 'Soft-delete timestamp: null = active, non-null = deleted';

-- Indexes
CREATE INDEX idx_proto_images_prototype_id ON proto_images(prototype_id);
