-- CreateEnum
CREATE TYPE "ConsentCategory" AS ENUM ('essential', 'analytics', 'marketing');

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "category" "ConsentCategory" NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- Exactly one subject: userId XOR visitorId
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_subject_xor"
  CHECK (
    ("userId" IS NOT NULL AND "visitorId" IS NULL)
    OR ("userId" IS NULL AND "visitorId" IS NOT NULL)
  );

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE INDEX "Consent_visitorId_idx" ON "Consent"("visitorId");

-- CreateIndex
CREATE INDEX "Consent_policyVersion_idx" ON "Consent"("policyVersion");

-- CreateIndex
CREATE INDEX "Consent_createdAt_idx" ON "Consent"("createdAt");

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
