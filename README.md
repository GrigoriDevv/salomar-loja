# Salomar Loja

Monorepo npm workspaces: loja masculina Salomar.

- `apps/web` — React + Vite (SPA)
- `apps/api` — NestJS + Prisma + Postgres (health + catálogo)

## Desenvolvimento local

```bash
cp .env.example .env
# Ajuste DATABASE_URL se necessário

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

npm run dev:api   # http://localhost:3000
npm run dev:web   # http://localhost:5173
```

Endpoints úteis:

- `GET /health` → `{ "status": "ok" }`
- `GET /catalog/products`
- `GET /catalog/products/:slug`
- `GET /catalog/products?intent=beira-mar`
- `POST /auth/login` — seed admin local: `admin@salomar.com.br` / `SalomarAdmin!2026` (ver `apps/api/.env.example`)

O front lê `VITE_API_URL` (default `http://localhost:3000`).

## Auditoria e dead letter (retenção)

Tabelas `FailedWebhook` (webhooks rejeitados) e `AccessLog` (acesso a dados pessoais, append-only no Postgres).

| Tabela | Retenção | Purge |
|--------|----------|-------|
| `FailedWebhook` | 90 dias | `purgeExpiredAuditRows` em `apps/api/src/modules/audit/retention.ts` |
| `AccessLog` | 365 dias | mesma helper (usa `purge_access_logs_before` no banco) |

Cron diário 04:00 UTC via Nest (`RetentionModule`); também `npm run retention:purge -w @salomar/api`.

## LGPD — consentimento e ROPA

- Tabela `Consent`: titular autenticado (`userId`) ou anônimo (`visitorId`), categoria, aceite, `policyVersion`, timestamp.
- Registro de Operações de Tratamento (versionado): [`docs/lgpd/ROPA-v1.0.md`](docs/lgpd/ROPA-v1.0.md) (`ropa-1.0` / política `privacy-1.0`).

## Segurança

A loja segue o mesmo padrão de segurança do projeto Elo. O resumo e as variáveis estão em [`docs/security.md`](docs/security.md). Em resumo: sessão em cookie httpOnly com proteção CSRF por origem, logout e troca de senha derrubam todas as sessões, helmet, rate limit por IP em todas as rotas e a API não sobe em produção sem os segredos obrigatórios.

## Criptografia e retenção

- Encryption at rest (Railway Postgres): [`docs/lgpd/encryption-at-rest.md`](docs/lgpd/encryption-at-rest.md)
- Mapa de retenção + cron 04:00 UTC: [`docs/lgpd/data-retention-map.md`](docs/lgpd/data-retention-map.md) (`npm run retention:purge -w @salomar/api`)
- CPF com criptografia de aplicação (AES-GCM): env `FIELD_ENCRYPTION_KEY`
- Verificação de restore de dump cifrado: [`docs/lgpd/backup-restore.md`](docs/lgpd/backup-restore.md) (`npm run backup:verify -w @salomar/api`)

## Rodar com Docker (tudo junto)

API, loja, Postgres e Redis em containers, sem instalar Node nem banco na máquina:

```bash
cp .env.docker.example .env
# preencha JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, FIELD_ENCRYPTION_KEY e SEED_ADMIN_PASSWORD
# (gere cada um com: openssl rand -base64 32)

docker compose up --build -d
docker compose exec api npm run prisma:seed -w @salomar/api   # só na primeira vez
```

- Loja: http://localhost:5173 · Admin: http://localhost:5173/admin/login · API: http://localhost:3000/health
- As migrações rodam sozinhas a cada `up`. O seed cria o admin e o catálogo; **não rode de novo** depois de ajustar o estoque (ele volta para 24 por tamanho).
- Dados ficam nos volumes `pgdata` e `redisdata` (`docker compose down` mantém; `down -v` apaga).
- Mudou `API_URL` ou `VITE_MP_PUBLIC_KEY`? Rode `docker compose up --build -d web` (entram no bundle no build).
- Pix e cartão em teste: use as credenciais **de teste** do Mercado Pago. O webhook do MP não alcança `localhost`; para ver o Pix aprovar sozinho, exponha a API com um túnel (ex.: `cloudflared tunnel --url http://localhost:3000`) e cadastre `https://<túnel>/webhooks/mercadopago` no painel do MP.

## Railway

Deploy de produção: API, web, Postgres e Redis no projeto Railway `salomar-loja`, com auto-deploy a cada merge em `main`. Passo a passo e variáveis: [`docs/ops/railway.md`](docs/ops/railway.md).

O CI do GitHub não faz `railway up` — evita deploy duplicado. Os arquivos `vercel.json` / `api/` continuam no repo, mas não são usados pelo Railway.

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (job check name: **`ci`**).

Em todo `pull_request` para `main` / `develop` / `develop-api` / `develop-web` e em `push` para `main`:

1. Lint (`oxlint` no web; API ainda no-op)
2. Migrate + testes (Postgres de serviço no Actions)
3. Build api + web

### Bloquear merge se o CI falhar

No GitHub: **Settings → Branches → Protect `main`** → Require status checks to pass → selecionar **`ci`**.

Via CLI (ajuste owner/repo):

```bash
# Exemplo — exigir o check "ci" em main (revise flags com a política do time)
gh api "repos/OWNER/REPO/branches/main/protection" -X PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

## Observabilidade

- Sentry API (`@sentry/nestjs`) e web (`@sentry/react`): DSN opcional — sem DSN o app sobe normalmente.
- Uptime (health + home; checkout quando existir): [`docs/ops/uptime.md`](docs/ops/uptime.md)
- Dashboard / alertas (payment, NF-e, webhook): [`docs/ops/sentry-alerts.md`](docs/ops/sentry-alerts.md)
- Helper de tags: `captureDomainError` em `apps/api/src/modules/observability/capture.ts`

## Scripts na raiz

| Script | Descrição |
|--------|-----------|
| `dev` / `dev:web` / `dev:api` | Dev servers |
| `build` | Build api + web |
| `test` | Testes dos workspaces |
| `prisma:generate` / `prisma:migrate` / `prisma:seed` | Prisma na API |
