-- AlterTable
ALTER TABLE "User" ADD COLUMN "cpfEncrypted" TEXT,
ADD COLUMN "cpfLookupHash" TEXT,
ADD COLUMN "anonymizedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_cpfLookupHash_key" ON "User"("cpfLookupHash");
