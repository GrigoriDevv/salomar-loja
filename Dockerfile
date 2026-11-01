# Imagens da loja Salomar (monorepo npm workspaces).
#   docker compose up --build   → usa os alvos "api" e "web" abaixo.

# Imagem completa (não slim): já traz o OpenSSL que o engine do Prisma exige.
FROM node:22-bookworm AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --no-audit --no-fund

# ---------- API (NestJS + Prisma) ----------
FROM deps AS api
COPY apps/api apps/api
RUN npm run build -w @salomar/api
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
# Aplica migrações pendentes e sobe a API. O seed é manual (ver README).
CMD ["sh", "-c", "npm run prisma:migrate -w @salomar/api && node apps/api/dist/main.js"]

# ---------- Web (Vite SPA) ----------
FROM deps AS web-build
ARG VITE_API_URL=http://localhost:3000
ARG VITE_MP_PUBLIC_KEY=
ARG VITE_SENTRY_DSN=
ENV VITE_API_URL=$VITE_API_URL VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY VITE_SENTRY_DSN=$VITE_SENTRY_DSN
COPY apps/web apps/web
RUN npm run build -w @salomar/web

FROM node:22-bookworm-slim AS web
WORKDIR /app
RUN npm install -g serve@14.2.6 --no-audit --no-fund
COPY --from=web-build /app/apps/web/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]
