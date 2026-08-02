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

## Criptografia e retenção

- Encryption at rest (Railway Postgres): [`docs/lgpd/encryption-at-rest.md`](docs/lgpd/encryption-at-rest.md)
- Mapa de retenção + cron 04:00 UTC: [`docs/lgpd/data-retention-map.md`](docs/lgpd/data-retention-map.md) (`npm run retention:purge -w @salomar/api`)
- CPF com criptografia de aplicação (AES-GCM): env `FIELD_ENCRYPTION_KEY`
- Verificação de restore de dump cifrado: [`docs/lgpd/backup-restore.md`](docs/lgpd/backup-restore.md) (`npm run backup:verify -w @salomar/api`)

## Railway (dois serviços)

No projeto Railway `salomar-loja` já existem:

| Serviço | Papel |
|---------|--------|
| `salomar-loja` | Web (SPA) — root dir `apps/web` |
| `salomar-api` | Nest API — root dir `apps/api` |
| `Postgres` | Banco (`DATABASE_URL` referenciado pela API) |

### API (`salomar-api`)
- Root directory: `apps/api` (usa `apps/api/railway.toml`)
- Env: `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `CORS_ORIGIN` = URL do web, `PORT`
- Após o primeiro deploy: migrate + seed (já no startCommand do `railway.toml`, ou via shell)

### Web (`salomar-loja`)
- Root directory: `apps/web` (usa `apps/web/railway.toml`)
- Build-time: `VITE_API_URL` = URL pública da API (gerar domínio no serviço `salomar-api`)

Deploy do monorepo só após o código estar no GitHub; o serviço web atual ainda é o SPA pré-monorepo.

## Scripts na raiz

| Script | Descrição |
|--------|-----------|
| `dev` / `dev:web` / `dev:api` | Dev servers |
| `build` | Build api + web |
| `test` | Testes dos workspaces |
| `prisma:generate` / `prisma:migrate` / `prisma:seed` | Prisma na API |
