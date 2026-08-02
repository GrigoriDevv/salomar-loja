# Mapa de retenção de dados sensíveis

Alinhado ao [`ROPA-v1.0.md`](ROPA-v1.0.md). Executado por `purgeExpiredSensitiveData` (cron Nest 04:00 UTC e `npm run retention:purge -w @salomar/api`).

| Dado | Prazo | Ação na rotina |
|------|-------|----------------|
| `FailedWebhook` | 90 dias | delete |
| `AccessLog` | 365 dias | delete via `purge_access_logs_before` |
| `RefreshToken` | `expiresAt` no passado | delete |
| `User.cpfEncrypted` / `cpfLookupHash` | conta com `anonymizedAt` set | nullificar |
| `Consent` | prova LGPD | **não** expurgar nesta rotina |

## Anonimização

Marcar `User.anonymizedAt = now()` (fluxo futuro de exclusão/anonimização do titular). A rotina diária limpa CPF criptografado e hash de lookup desses usuários, sem apagar histórico de pedidos.

## Encryption at rest

Ver [`encryption-at-rest.md`](encryption-at-rest.md).
