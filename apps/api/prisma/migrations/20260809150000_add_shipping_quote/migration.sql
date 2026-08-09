-- AlterTable
ALTER TABLE "Order" ADD COLUMN "shippingCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shippingServiceCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCep" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingState" TEXT;

-- CreateTable
CREATE TABLE "ShippingQuoteCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingQuoteCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingQuoteCache_cacheKey_key" ON "ShippingQuoteCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ShippingQuoteCache_expiresAt_idx" ON "ShippingQuoteCache"("expiresAt");
