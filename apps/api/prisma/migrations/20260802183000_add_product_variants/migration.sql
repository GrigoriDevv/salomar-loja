-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductVariant_categoryId_size_color_idx" ON "ProductVariant"("categoryId", "size", "color");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "ProductVariant"("productId", "size", "color");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ensure Product.stock exists for backfill (noop if already present)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 24;

-- Backfill variants from Product.sizes × tone
INSERT INTO "ProductVariant" ("id", "productId", "categoryId", "size", "color", "stock", "active", "createdAt", "updatedAt")
SELECT
  md5(p."id" || ':' || size_item || ':' || p."tone"),
  p."id",
  p."categoryId",
  size_item,
  p."tone",
  p."stock",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product" p
CROSS JOIN LATERAL unnest(COALESCE(p."sizes", ARRAY[]::text[])) AS size_item;

-- Drop denormalized columns from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "sizes";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "stock";
