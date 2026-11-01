# Padrão de segurança

A Salomar segue o padrão de segurança do projeto **Elo** (backend NestJS da Navoxi). Quando mexer em autenticação ou na camada HTTP, mantenha estes pontos.

## Sessão

- O login (e o cadastro, refresh e troca de senha) grava o JWT de acesso num **cookie httpOnly** `salomar_session` (`SameSite=Lax`, `Secure` automático em https, `COOKIE_DOMAIN` opcional). A loja no navegador **não guarda token nenhum**: o `localStorage` só tem e-mail e papel para a interface.
- A API também aceita `Authorization: Bearer` (scripts, testes, apps). O corpo do login continua trazendo os tokens para esses clientes.
- Validade padrão de 1 dia (`JWT_ACCESS_EXPIRES`).
- **Revogação:** cada usuário tem `sessionVersion`. `POST /auth/logout`, a troca de senha e a redefinição pelo link incrementam a versão e revogam os refresh tokens, então todo token emitido antes deixa de valer na hora. Conta anonimizada (LGPD) também perde a sessão.
- Os guards conferem o token **e** o usuário no banco a cada pedido: o papel (admin, atendente, cliente) vem do banco, não do token.

## CSRF

Pedido `POST/PUT/PATCH/DELETE` autenticado só pelo cookie precisa vir de uma origem listada em `CORS_ORIGIN`; senão a API responde 403 antes de qualquer rota (`src/bootstrap/trusted-origin.ts`). Pedidos com Bearer e webhooks (sem cookie) não passam por essa checagem.

Loja e API precisam estar no **mesmo site** (ex.: `salomar.com.br` e `api.salomar.com.br`, ou `localhost` em portas diferentes). Domínios de plataforma como `*.up.railway.app` ou `*.vercel.app` contam como sites diferentes e o navegador não manda o cookie.

## HTTP

- `helmet` com `Cross-Origin-Resource-Policy: same-site`.
- CORS só para `CORS_ORIGIN`; vazio bloqueia o navegador (não há origem padrão).
- `ValidationPipe` com `whitelist` e `forbidNonWhitelisted`.
- `TRUST_PROXY` atrás de proxy, para o rate limit usar o IP real.

## Rate limit

- Todas as rotas: `RATE_LIMIT_PER_MINUTE` por IP (padrão 120).
- Rotas que aceitam senha ou token (login, cadastro, refresh, recuperação, redefinição e troca de senha): `AUTH_RATE_LIMIT_PER_MINUTE` (padrão 10), com `@SensitiveRateLimit()`.
- O webhook do Mercado Pago fica fora do rate limit (`@SkipThrottle`), porque o controle ali é a assinatura.

## Senhas

- bcrypt com custo 12 (`src/modules/auth/password.ts`). Hashes antigos com custo 10 continuam válidos.
- Login com e-mail inexistente faz uma comparação bcrypt falsa, para o tempo de resposta não revelar se a conta existe. A recuperação de senha responde igual para qualquer e-mail.

## Configuração em produção

Com `NODE_ENV=production` a API **não sobe** sem `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY` e `CORS_ORIGIN`, nem com segredos JWT de exemplo, curtos (menos de 32 caracteres) ou iguais entre si. Com `MP_ACCESS_TOKEN` definido, `MP_WEBHOOK_SECRET` também é obrigatório, e o webhook recusa chamadas sem assinatura válida.

## Dependências

Rode `npm audit --omit=dev` antes de publicar. Os avisos que sobram hoje são de ferramentas que não recebem dados de clientes: `deepmerge-ts` (CLI do Prisma, só no build e nas migrations) e `minimatch` (configuração do `serve` que entrega o front no Docker).
