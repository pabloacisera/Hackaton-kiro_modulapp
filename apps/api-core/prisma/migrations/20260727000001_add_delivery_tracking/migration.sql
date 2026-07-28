-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('pending', 'delivered');

-- CreateEnum
CREATE TYPE "OrderOrigin" AS ENUM ('order', 'quote');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "origin" "OrderOrigin" NOT NULL DEFAULT 'order';
ALTER TABLE "orders" ADD COLUMN "quote_id" TEXT;
ALTER TABLE "orders" ALTER COLUMN "prototype_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "delivery_tracking" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "estimated_delivery_date" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'pending',
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_tracking_order_id_key" ON "delivery_tracking"("order_id");

-- AddForeignKey
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
