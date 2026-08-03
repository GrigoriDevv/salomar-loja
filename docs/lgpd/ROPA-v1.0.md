# ROPA — Registro de Operações de Tratamento

**Versão:** 1.0 (`ropa-1.0`)  
**Política de privacidade vinculada:** `privacy-1.0`  
**Última atualização:** 2026-08-02  
**Controlador:** Salomar (loja masculina — operação digital `salomar-loja`)

Este documento descreve as operações de tratamento de dados pessoais da plataforma, em alinhamento com a LGPD (Lei nº 13.709/2018). Novas versões devem incrementar o número do arquivo (`ROPA-v1.1.md`, etc.) e atualizar `policyVersion` nos registros de consentimento.

## 1. Titulares

| Titular | Identificação |
|---------|---------------|
| Cliente autenticado | `User.id` / e-mail |
| Visitante anônimo | `visitorId` (UUID/cookie no client) |

## 2. Operações de tratamento

| # | Finalidade | Dados | Base legal | Categorias de consentimento | Retenção |
|---|------------|-------|------------|-----------------------------|----------|
| 1 | Conta e autenticação | nome, e-mail, hash de senha, tokens | Execução de contrato / legítimo interesse (segurança) | `essential` | Enquanto a conta existir + prazo legal |
| 2 | Pedidos e pagamento | itens, valores, ids de transação | Execução de contrato | `essential` | Conforme obrigações fiscais/contratuais |
| 3 | Catálogo e experiência da loja | preferências de navegação mínimas | Legítimo interesse / consentimento quando aplicável | `essential` | Sessão / política de cookies |
| 4 | Métricas e melhoria do produto | eventos agregados / analytics | Consentimento | `analytics` | Até revogação ou 365 dias |
| 5 | Comunicação mercadológica | e-mail / preferências de marketing | Consentimento | `marketing` | Até revogação |
| 6 | Auditoria de acesso a dados pessoais | ator, ação, recurso (`AccessLog`) | Obrigação legal / legítimo interesse | n/a (controle interno) | 365 dias |
| 7 | Dead letter de webhooks | payload técnico, motivo, `traceId` | Legítimo interesse (segurança/integridade) | n/a | 90 dias |

## 3. Compartilhamentos / operadores

| Destinatário | Papel | Dados típicos |
|--------------|-------|---------------|
| Hospedagem (ex.: Railway) | Operador de infraestrutura | Logs técnicos, DB |
| Gateway de pagamento (ex.: Mercado Pago) | Operador de pagamento | Dados necessários à cobrança (quando integrado) |

Operadores devem constar em contratos/DPA quando em produção.

## 4. Consentimento

Registros na tabela `Consent`:

- Titular: `userId` **ou** `visitorId` (nunca ambos)
- `category`: `essential` \| `analytics` \| `marketing`
- `accepted`: true/false
- `policyVersion`: versão da política (ex.: `privacy-1.0`)
- `createdAt`: momento do registro (append — nova linha a cada mudança)

Versão ROPA desta revisão: **`ropa-1.0`**.

## 5. Direitos do titular

Acesso, correção, anonimização/eliminação, portabilidade, informação sobre compartilhamentos, revogação de consentimento — via canais oficiais da Salomar (a definir no site/política).

## 6. Segurança

- Credenciais com hash; secrets apenas em variáveis de ambiente
- `AccessLog` append-only no banco
- Controles de acesso por `Role` (`cliente`, `atendente`, `admin`)

## Histórico de versões

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-08-02 | Versão inicial alinhada ao schema Consent + audit |
