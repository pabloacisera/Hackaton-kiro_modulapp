-- CreateEnum
CREATE TYPE "PrototypeCategory" AS ENUM ('modular_furniture', 'arches');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('created', 'payment_initiated', 'paid_pending_acceptance', 'accepted', 'rejected', 'payment_failed');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('discarded_incomplete_data', 'pending', 'quoted', 'accepted', 'rejected', 'expired', 'payment_initiated', 'paid', 'payment_expired', 'archived');

-- CreateEnum
CREATE TYPE "ComplaintReferenceType" AS ENUM ('order', 'quote', 'unknown');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('received', 'under_review', 'refund_approved', 'resolved_other_way', 'rejected');

-- CreateEnum
CREATE TYPE "StockChangeSource" AS ENUM ('manual', 'excel_import', 'order_consumption');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('new_purchase', 'new_quote_request', 'quote_response', 'new_complaint', 'low_stock_minimum', 'payment_confirmed');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prototypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PrototypeCategory" NOT NULL,
    "price_usd" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "build_on_demand" BOOLEAN NOT NULL DEFAULT false,
    "estimated_delivery_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prototypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proto_images" (
    "id" TEXT NOT NULL,
    "prototype_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proto_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "prototype_id" TEXT NOT NULL,
    "price_usd_snapshot" DECIMAL(10,2) NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'created',
    "rejection_reason" TEXT,
    "estimated_delivery_date" TIMESTAMP(3),
    "payment_service_ref" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "needed_by_date" DATE NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'pending',
    "quoted_price_usd" DECIMAL(10,2),
    "quoted_lead_time_days" INTEGER,
    "estimated_delivery_date" DATE,
    "quote_sent_at" TIMESTAMP(3),
    "quote_response_deadline" TIMESTAMP(3),
    "payment_deadline" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "action_token_hash" TEXT,
    "action_token_used" BOOLEAN NOT NULL DEFAULT false,
    "payment_service_ref" TEXT,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "reference_type" "ComplaintReferenceType" NOT NULL,
    "reference_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'received',
    "resolution_notes" TEXT,
    "refund_request_id" TEXT,
    "locale" VARCHAR(5) NOT NULL DEFAULT 'es',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplies" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "current_qty" DECIMAL(10,2) NOT NULL,
    "min_stock" DECIMAL(10,2) NOT NULL,
    "unit_cost_usd" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_stock_change_log" (
    "id" TEXT NOT NULL,
    "supply_id" TEXT NOT NULL,
    "previous_qty" DECIMAL(10,2) NOT NULL,
    "new_qty" DECIMAL(10,2) NOT NULL,
    "source" "StockChangeSource" NOT NULL,
    "actor" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_stock_change_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "low_stock_alert_state" (
    "id" TEXT NOT NULL,
    "supply_id" TEXT NOT NULL,
    "last_notified_at" TIMESTAMP(3) NOT NULL,
    "last_notified_qty" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "low_stock_alert_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "reference_url" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "supplies_sku_key" ON "supplies"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "low_stock_alert_state_supply_id_key" ON "low_stock_alert_state"("supply_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proto_images" ADD CONSTRAINT "proto_images_prototype_id_fkey" FOREIGN KEY ("prototype_id") REFERENCES "prototypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_stock_change_log" ADD CONSTRAINT "supply_stock_change_log_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "low_stock_alert_state" ADD CONSTRAINT "low_stock_alert_state_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
