# Encryption at rest — Postgres (Railway)

**Projeto:** `salomar-loja`  
**Serviço de banco:** Postgres gerenciado pela Railway (referenciado por `DATABASE_URL` na API)

## O que significa

Encryption at rest protege os dados no disco do provedor. Na Railway, volumes de Postgres usam criptografia de disco gerenciada pela infraestrutura — **não** se habilita via Prisma/migration.

A criptografia de aplicação (ex.: CPF com AES-GCM) é uma camada **adicional** e está documentada em [`data-retention-map.md`](data-retention-map.md) / código em `apps/api/src/modules/crypto/`.

## Checklist (dashboard Railway)

- [ ] Serviço **Postgres** existe no projeto `salomar-loja` e está healthy
- [ ] `DATABASE_URL` da API aponta para `${{Postgres.DATABASE_URL}}` (sem URL hardcoded no repo)
- [ ] Backups do Postgres habilitados / política de retenção de backup revisada no painel
- [ ] Acesso ao DB restrito (sem porta pública desnecessária em produção)
- [ ] Secrets (`FIELD_ENCRYPTION_KEY`, JWT, etc.) só em variáveis de ambiente do serviço

## Limitações

- Esta card **não** altera settings reais no dashboard (requer acesso humano).
- Confirmar no painel Railway a política atual de backup/restore do plugin Postgres.
- Restore criptografado local: ver [`backup-restore.md`](backup-restore.md).
