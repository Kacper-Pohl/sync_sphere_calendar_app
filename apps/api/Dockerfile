FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache git libc6-compat
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm prisma generate --schema=./packages/database/prisma/schema.prisma
RUN pnpm --filter database build
RUN pnpm --filter api... build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
WORKDIR /app/apps/api
EXPOSE 3001
ENV PORT=3001
CMD ["pnpm", "run", "start:prod"]
