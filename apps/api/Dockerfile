FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN mkdir -p packages/types && echo '{"name":"@gestao/types","version":"0.0.0"}' > packages/types/package.json
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

USER nestjs
EXPOSE 3001
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main"]
