# Backup e restauração criptografada

## Railway (produção)

1. No dashboard do Postgres do projeto `salomar-loja`, localize backups / snapshots disponíveis.
2. Restaure para um database/instância de verificação (não sobrescreva produção sem plano).
3. Aponte temporariamente uma API de staging para o DB restaurado e valide health + queries críticas (`User`, `Consent`, `FailedWebhook`).
4. Encryption at rest do volume: ver [`encryption-at-rest.md`](encryption-at-rest.md).

## Smoke local (dump cifrado)

Requer `pg_dump`, `psql`, `openssl` e Postgres local acessível via `DATABASE_URL`.

```bash
export BACKUP_TEST_PASSPHRASE='change-me-local-only'
npm run backup:verify -w @salomar/api
```

O script:

1. Faz `pg_dump` do banco apontado por `DATABASE_URL`
2. Cifra com `openssl enc -aes-256-cbc`
3. Decifra e restaura em `salomar_backup_verify`
4. Confere existência das tabelas `User`, `Consent`, `FailedWebhook`
5. Remove o database temporário

Não use a passphrase de teste em produção.
