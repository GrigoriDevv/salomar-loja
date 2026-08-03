#!/usr/bin/env bash
set -euo pipefail

# Smoke: dump local DB → openssl encrypt → decrypt → restore to temp DB → assert tables → drop.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

# pg_* tools reject Prisma-only query params like schema=
export PG_URL
PG_URL="$(node -e "
const raw = process.env.DATABASE_URL;
const u = new URL(raw.replace(/^postgresql:/i, 'http:'));
u.searchParams.delete('schema');
console.log(u.toString().replace(/^http:/i, 'postgresql:'));
")"

PASSPHRASE="${BACKUP_TEST_PASSPHRASE:-salomar-backup-verify-local}"
TMP_DIR="$(mktemp -d)"
DUMP_FILE="$TMP_DIR/salomar.dump"
ENC_FILE="$TMP_DIR/salomar.dump.enc"
DEC_FILE="$TMP_DIR/salomar.dump.dec"
VERIFY_DB="salomar_backup_verify"

cleanup() {
  rm -rf "$TMP_DIR"
  psql "$PG_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${VERIFY_DB};" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> pg_dump"
pg_dump --format=custom --no-owner --no-acl --dbname="$PG_URL" --file="$DUMP_FILE"

echo "==> encrypt"
openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:${PASSPHRASE}" -in "$DUMP_FILE" -out "$ENC_FILE"

echo "==> decrypt"
openssl enc -d -aes-256-cbc -pbkdf2 -pass "pass:${PASSPHRASE}" -in "$ENC_FILE" -out "$DEC_FILE"

echo "==> recreate verify database"
psql "$PG_URL" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${VERIFY_DB}' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
psql "$PG_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${VERIFY_DB};"
psql "$PG_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${VERIFY_DB};"

VERIFY_URL="$(node -e "
const u = new URL(process.env.PG_URL.replace(/^postgresql:/i, 'http:'));
u.pathname = '/${VERIFY_DB}';
u.search = '';
console.log(u.toString().replace(/^http:/i, 'postgresql:'));
")"

echo "==> pg_restore into ${VERIFY_DB}"
pg_restore --no-owner --no-acl --dbname="$VERIFY_URL" "$DEC_FILE"

echo "==> assert tables"
MISSING="$(psql "$VERIFY_URL" -Atc "
SELECT string_agg(t, ', ')
FROM (VALUES ('User'), ('Consent'), ('FailedWebhook')) AS v(t)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = v.t
);
")"

if [[ -n "${MISSING}" ]]; then
  echo "Missing tables after restore: ${MISSING}" >&2
  exit 1
fi

echo "OK: encrypted backup restore verified (User, Consent, FailedWebhook present)"
