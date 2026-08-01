-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- Seed categories from existing product.category values
INSERT INTO "Category" ("id", "slug", "name", "active", "createdAt", "updatedAt")
SELECT
  md5(random()::text || clock_timestamp()::text || p."category"),
  lower(regexp_replace(translate(p."category", 'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'), '[^a-zA-Z0-9]+', '-', 'g')),
  p."category",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "category" FROM "Product") AS p;

-- Add nullable categoryId, backfill, then enforce NOT NULL
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

UPDATE "Product" AS prod
SET "categoryId" = cat."id"
FROM "Category" AS cat
WHERE cat."name" = prod."category";

ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop old string column
ALTER TABLE "Product" DROP COLUMN "category";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
