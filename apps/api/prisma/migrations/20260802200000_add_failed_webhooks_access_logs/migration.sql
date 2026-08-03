-- CreateEnum
CREATE TYPE "FailedWebhookStatus" AS ENUM ('pending', 'retrying', 'exhausted', 'discarded');

-- CreateTable
CREATE TABLE "FailedWebhook" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "status" "FailedWebhookStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedWebhook_traceId_idx" ON "FailedWebhook"("traceId");

-- CreateIndex
CREATE INDEX "FailedWebhook_status_idx" ON "FailedWebhook"("status");

-- CreateIndex
CREATE INDEX "AccessLog_createdAt_idx" ON "AccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "AccessLog_actor_idx" ON "AccessLog"("actor");

-- Append-only: block UPDATE/DELETE unless session flag set for retention purge
CREATE OR REPLACE FUNCTION deny_access_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.purging_access_logs', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'AccessLog is append-only';
END;
$$;

CREATE TRIGGER access_log_no_update
  BEFORE UPDATE OR DELETE ON "AccessLog"
  FOR EACH ROW
  EXECUTE FUNCTION deny_access_log_mutation();

-- Retention purge helper (bypasses append-only via session flag)
CREATE OR REPLACE FUNCTION purge_access_logs_before(before_ts TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  PERFORM set_config('app.purging_access_logs', 'on', true);
  DELETE FROM "AccessLog" WHERE "createdAt" < before_ts;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
