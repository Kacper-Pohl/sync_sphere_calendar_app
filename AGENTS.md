# AGENTS.md

Instructions for AI coding agents working in this repository.

## Critical rule: Docker-first

This project runs in Docker. **All runtime commands must execute inside containers**, not on the host OS.

```bash
docker compose exec api <command>   # default for most work
docker compose exec web <command>   # frontend-specific
docker compose exec db <command>    # database shell
```

Never suggest bare `pnpm`, `prisma`, `nest`, or `next` on the host unless the user explicitly requests it.

## Quick start

```bash
# Preferred: start with Docker Compose Watch (hot reload + auto-rebuild)
docker compose watch

# Alternative: detached without watch
docker compose up -d
```

### Docker Compose Watch

`docker-compose.yml` defines `develop.watch` for `api` and `web`:

- **`sync`** — pushes source edits into the container (API src, packages, web app/components/lib/public)
- **`rebuild`** — rebuilds the service when `package.json` or `pnpm-lock.yaml` changes

NestJS and Next.js run in watch mode inside containers. Polling is enabled for Windows (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`).

| Service    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:3000 |
| API        | http://localhost:3001 |
| PostgreSQL | localhost:5432        |

## Repository structure

| Path                 | Purpose                    |
| -------------------- | -------------------------- |
| `apps/web/`          | Next.js 15 frontend        |
| `apps/api/`          | NestJS backend             |
| `packages/database/` | Prisma schema & client     |
| `packages/tsconfig/` | Shared TS configs          |
| `docker-compose.yml` | Dev environment definition |

## Common tasks

```bash
# Install dependencies
docker compose exec api pnpm install

# Prisma generate
docker compose exec api pnpm prisma generate --schema=./packages/database/prisma/schema.prisma

# Prisma migrate
docker compose exec api pnpm prisma migrate dev --name <name> --schema=./packages/database/prisma/schema.prisma

# Run tests
docker compose exec api pnpm --filter api test

# Lint
docker compose exec api pnpm run lint

# Rebuild after package.json changes
docker compose up -d --build api web

# Logs
docker compose logs -f api
```

## Cursor rules & skills

Detailed guidance lives in:

- `.cursor/rules/` — always-on and file-scoped conventions
- `.cursor/skills/` — workflow skills (`docker-workflow`, `calendar-app-development`)

## Stack

Turborepo · pnpm · Next.js 15 · NestJS 11 · Prisma 7 · PostgreSQL 16 · Tailwind · Shadcn UI · Google OAuth
