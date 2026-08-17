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
| `apps/web/`          | Next.js 16 frontend        |
| `apps/api/`          | NestJS backend             |
| `apps/e2e/`          | Playwright E2E tests       |
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

# Run tests (see the Testing section below)
docker compose exec api pnpm --filter api test

# Lint
docker compose exec api pnpm run lint

# Rebuild after package.json changes
docker compose up -d --build api web

# Logs
docker compose logs -f api
```

## Testing

Three separate layers, each run inside a container:

| Layer         | Where       | Runner     | Command                                          |
| ------------- | ----------- | ---------- | ------------------------------------------------ |
| Backend unit  | `apps/api/` | Jest       | `docker compose exec api pnpm --filter api test` |
| Frontend unit | `apps/web/` | Vitest     | `docker compose exec web pnpm --filter web test` |
| End-to-end    | `apps/e2e/` | Playwright | `docker compose --profile test run --rm e2e`     |

Notes:

- Unit test files live next to the code they test (`*.spec.ts` in `apps/api`, `*.test.ts(x)` in `apps/web`).
- The `e2e` service sits behind the `test` Compose profile, so `docker compose up`/`watch` never starts it. It waits for `web` to report healthy, then runs Playwright against `http://web:3000`.
- The Playwright image tag in `apps/e2e/Dockerfile` must match the `@playwright/test` version in `apps/e2e/package.json`.
- After changing any `package.json`, rebuild — named `node_modules` volumes shadow the host:
  `docker compose up -d --build web`
- E2E coverage is limited to unauthenticated pages. Google OAuth cannot be automated; testing `/dashboard` needs a JWT/`storageState` seeding strategy that does not exist yet.

## Cursor rules & skills

Detailed guidance lives in:

- `.cursor/rules/` — always-on and file-scoped conventions
- `.cursor/skills/` — workflow skills (`docker-workflow`, `calendar-app-development`)

## Stack

Turborepo · pnpm · Next.js 16 · React 19 · NestJS 11 · Prisma 7 · PostgreSQL 16 · Tailwind · Shadcn UI · Google OAuth
