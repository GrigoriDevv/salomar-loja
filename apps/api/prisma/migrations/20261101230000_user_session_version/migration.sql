-- Versão de sessão: incrementada no logout e na troca/redefinição de senha para invalidar tokens antigos.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
