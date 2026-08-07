# Uptime monitoring (Salomar)

Checks HTTP externos. Implementação atual: GitHub Actions (`.github/workflows/uptime.yml`) a cada 5 min — equivalente a UptimeRobot/Better Stack sem conta SaaS.

## URLs de produção (Railway)

| Serviço | URL |
|---------|-----|
| API | `https://salomar-api-production.up.railway.app` |
| Web | `https://salomar-loja-production.up.railway.app` |

## Monitores

| ID | URL | Expectativa | Intervalo | Onde |
|----|-----|-------------|-----------|------|
| A — API health | `GET https://salomar-api-production.up.railway.app/health` | HTTP 200; body com status ok | 5 min | GHA `Uptime` |
| B — Web home | `GET https://salomar-loja-production.up.railway.app/` | HTTP 200 | 5 min | GHA `Uptime` |
| C — Checkout | `GET {WEB_URL}/checkout` (ou rota final) | HTTP 200 | 5 min | — |

**Monitor C:** pendente até existir rota/fluxo de checkout estável. Não criar o check antes da feature.

**Nota:** o serviço `salomar-api` precisa estar **Online** no Railway; health check falha enquanto estiver offline (hoje: trial Railway expirado / sem deployment).

## Alertas

- GitHub Actions: falha do workflow notifica o e-mail/GitHub do repo (Settings → Notifications / Actions).
- Se migrar para UptimeRobot: alerta e-mail após 2 falhas; notificar recovery.

## Checklist

- [x] Conta no provedor de uptime (GitHub Actions no repo)
- [x] Monitor A apontando para `/health` (workflow `Uptime`)
- [x] Monitor B apontando para a home (workflow `Uptime`)
- [ ] Monitor C adicionado quando checkout existir
- [x] Canal de alerta revisado pela operação (notificações Actions do GitHub)
- [ ] `salomar-api` Online no Railway (bloqueado: trial expirado — renovar plano e `railway up`)
