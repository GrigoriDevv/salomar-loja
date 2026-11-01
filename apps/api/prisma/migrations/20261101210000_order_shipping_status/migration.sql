-- Status de envio e código de rastreio.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'shipped' AFTER 'paid';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'delivered' AFTER 'shipped';

ALTER TABLE "Order" ADD COLUMN "trackingCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
