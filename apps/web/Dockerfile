FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache git libc6-compat
RUN corepack enable

# Stage dev: instaluje wszystkie zależności i uruchamia w trybie watch
FROM base AS dev
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
RUN pnpm install
EXPOSE 3000
# CMD jest nadpisywany przez docker-compose command

# Stage builder: buduje produkcyjny artefakt Next.js
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm prisma generate --schema=./packages/database/prisma/schema.prisma
RUN pnpm --filter database build
ENV NODE_ENV=production
RUN pnpm --filter web... build

# Stage runner: minimalistyczny obraz produkcyjny
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
WORKDIR /app/apps/web
EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "run", "start"]
