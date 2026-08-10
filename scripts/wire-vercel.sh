#!/usr/bin/env bash
# Wire Salomar web ↔ API on Vercel (run after: npx vercel login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p .vercel

API_URL="${API_URL:-https://salomar-loja-api.vercel.app}"
WEB_URL="${WEB_URL:-https://salomar-loja-web.vercel.app}"
CORS_VAL="${WEB_URL},http://localhost:5173"

echo "==> API envs + prod deploy"
cp apps/api/.vercel/project.json .vercel/project.json
for ENV in production preview; do
  printf '%s' "$CORS_VAL" | npx --yes vercel@41 env add CORS_ORIGIN "$ENV" --force || true
  printf '%s' "$WEB_URL" | npx --yes vercel@41 env add WEB_ORIGIN "$ENV" --force || true
  printf '0' | npx --yes vercel@41 env add SENTRY_ENABLED "$ENV" --force || true
  if [[ -f /tmp/salomar-db-url.txt ]]; then
    npx --yes vercel@41 env add DATABASE_URL "$ENV" --force < /tmp/salomar-db-url.txt || true
  fi
done
npx --yes vercel@41 deploy --prod --yes

echo "==> WEB envs + prod deploy (Root Directory should be apps/web)"
cp apps/web/.vercel/project.json .vercel/project.json
for ENV in production preview; do
  printf '%s' "$API_URL" | npx --yes vercel@41 env add VITE_API_URL "$ENV" --force || true
  printf '0' | npx --yes vercel@41 env add VITE_SENTRY_ENABLED "$ENV" --force || true
done
npx --yes vercel@41 deploy --prod --yes --cwd apps/web

echo "Verify:"
echo "  curl -sS $API_URL/health"
echo "  open $WEB_URL"
