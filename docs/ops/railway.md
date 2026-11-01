# Deploy no Railway

Projeto Railway `salomar-loja` com quatro serviços, todos ligados ao repositório `GrigoriDevv/salomar-loja`, branch `main` (auto-deploy no merge).

| Serviço | Tipo | Config |
|---------|------|--------|
| `salomar-api` | GitHub repo | Root directory `/`, config file `/apps/api/railway.toml` |
| `salomar-loja` | GitHub repo (web) | Root directory `/`, config file `/apps/web/railway.toml` |
| `Postgres` | Database → PostgreSQL | — |
| `Redis` | Database → Redis | — (fila BullMQ dos webhooks do Mercado Pago) |

O root directory precisa ser a raiz do repo: o build usa npm workspaces e o `package-lock.json` da raiz. Com root `apps/api` o Railway só envia essa pasta e o `npm install` quebra.

A Node é fixada em 22 pelo `engines` do `package.json` da raiz (o Railpack respeita).

## Passo a passo

1. **Postgres e Redis:** no projeto, *New → Database* para cada um.
2. **API (`salomar-api`):**
   - *Settings → Source*: root directory `/`; *Config-as-code → Railway config file*: `/apps/api/railway.toml`.
   - *Settings → Networking*: *Generate Domain*.
   - Variáveis (tabela abaixo).
3. **Web (`salomar-loja`):**
   - *Settings → Source*: root directory `/`; config file `/apps/web/railway.toml`.
   - *Generate Domain*.
   - Variáveis (tabela abaixo). Mudou `VITE_*`? Precisa de **redeploy** (o valor entra no bundle no build).
4. **Primeiro deploy:** o `preDeployCommand` roda `prisma migrate deploy` antes de cada deploy da API. Se a migração falhar, a versão anterior continua no ar.
5. **Seed (uma vez só):** cria o admin e o catálogo de exemplo. Não roda no start de propósito, para não sobrescrever dados de produção a cada deploy. Com a [CLI do Railway](https://docs.railway.com/guides/cli) logada e o projeto linkado:
   ```bash
   railway run -s salomar-api npm run prisma:seed -w @salomar/api
   ```
   Defina `SEED_ADMIN_PASSWORD` forte na API **antes** de rodar.
6. **Mercado Pago:** no painel do MP, webhook apontando para `https://<dominio-api>/webhooks/mercadopago`; copie a assinatura secreta para `MP_WEBHOOK_SECRET`.
7. **Conferir:** `GET https://<dominio-api>/health` → `{"status":"ok"}`; abrir o domínio web e navegar no catálogo.

## Variáveis — `salomar-api`

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://${{salomar-loja.RAILWAY_PUBLIC_DOMAIN}}` |
| `WEB_ORIGIN` | `https://${{salomar-loja.RAILWAY_PUBLIC_DOMAIN}}` |
| `JWT_ACCESS_SECRET` | aleatório, 32+ bytes (ver comando abaixo) |
| `JWT_REFRESH_SECRET` | aleatório, diferente do anterior |
| `FIELD_ENCRYPTION_KEY` | 32 bytes em base64. **Guarde em lugar seguro:** perder a chave = perder os CPFs cifrados |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | admin real, senha forte |
| `MP_ACCESS_TOKEN` | token de produção (`APP_USR-...`) ou de teste enquanto valida |
| `MP_WEBHOOK_SECRET` | assinatura secreta do webhook |
| `RESEND_API_KEY` / `RESEND_FROM` | e-mails (recuperação de senha e confirmação de pedido). `RESEND_FROM` precisa ser de um domínio verificado no Resend |
| `STORE_NOTIFY_EMAIL` | e-mail(s) da loja que recebem aviso de venda nova, separados por vírgula |
| `SENTRY_ENABLED` / `SENTRY_DSN` / `SENTRY_ENVIRONMENT` | `1` / DSN / `production` (opcional) |

`PORT` é injetada pelo Railway; não defina.

Gerar segredos:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Variáveis — `salomar-loja` (web)

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | `https://${{salomar-api.RAILWAY_PUBLIC_DOMAIN}}` |
| `VITE_MP_PUBLIC_KEY` | public key do Mercado Pago (mesmo ambiente do access token) |
| `VITE_SENTRY_DSN` / `VITE_SENTRY_ENABLED` / `VITE_SENTRY_ENVIRONMENT` | opcional |

## Domínio próprio

*Settings → Networking → Custom Domain* em cada serviço (ex.: `salomar.com.br` no web, `api.salomar.com.br` na API). Depois troque `CORS_ORIGIN`, `WEB_ORIGIN` e `VITE_API_URL` para os domínios novos, redeploy do web, e atualize a URL do webhook no Mercado Pago e em [`uptime.md`](uptime.md).

## Custo e escala

Para o volume inicial, 1 réplica de cada serviço basta. A API não guarda estado em memória (fila no Redis, sessão via JWT), então dá para subir réplicas depois sem mudar código. Ative backups do Postgres em *Postgres → Backups*.
