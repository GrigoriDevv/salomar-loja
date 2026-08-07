# Sentry — dashboard e alertas (Salomar)

Dashboard operacional = **Sentry Issues + Performance** (projetos separados). Sem Grafana nesta fase.

## Projetos

| Projeto Sentry | App | DSN env |
|----------------|-----|---------|
| `salomar-api` / `node-nestjs` | Nest API | `SENTRY_DSN` |
| `salomar-web` | Vite SPA | `VITE_SENTRY_DSN` |

Environments: `development`, `staging`, `production` via `SENTRY_ENVIRONMENT` / `VITE_SENTRY_ENVIRONMENT`.

## Tags de domínio

Na API, use `captureDomainError` (`apps/api/src/modules/observability/capture.ts`):

| Tag | Uso |
|-----|-----|
| `domain:payment` | Falhas de pagamento / gateway |
| `domain:nfe` | Emissão / retorno NF-e |
| `domain:webhook` | Webhooks rejeitados / dead letter |

## Alert rules

1. **Payment failures** — filter `domain:payment`, notify on new issue / spike.
2. **NF-e** — filter `domain:nfe`.
3. **Webhook** — filter `domain:webhook`.

Canal sugerido: e-mail da operação (+ Slack se houver integração Sentry).

### Criar via script (API)

```bash
export SENTRY_AUTH_TOKEN=sntrys_...   # User Auth Token: project:write, org:read
export SENTRY_ORG=navoxi
export SENTRY_PROJECT=node-nestjs
./scripts/ops/create-sentry-domain-alerts.sh
```

Ou no UI: Alerts → Create Alert → Issues → filter tag `domain` = `payment` | `nfe` | `webhook`.

## Checklist

- [x] Projeto API `node-nestjs` / `salomar-api` criado (DSN no Railway)
- [ ] Projeto React `salomar-web` criado + `VITE_SENTRY_DSN` no Railway `salomar-loja` + redeploy
- [x] `VITE_SENTRY_ENVIRONMENT=production` e `VITE_SENTRY_TRACES_SAMPLE_RATE=0.1` no Railway web
- [ ] Três alert rules por tag `domain` (rodar script com `SENTRY_AUTH_TOKEN` ou criar no UI)
- [x] Sample rate de traces revisado em produção (`0.1` default)
