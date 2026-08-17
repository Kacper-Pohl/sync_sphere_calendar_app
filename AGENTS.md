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

## Critical rule: the working copy must sit on a Linux filesystem

Native Linux and WSL2 are both fine. A working copy on a Windows drive
(`C:\...`, `/mnt/c/...`) is not.

Docker Desktop reaches Windows drives through VirtioFS, which delivers no
inotify events into containers. Every file watcher then goes silent: an edit
does reach the container, but nothing recompiles and nothing errors out, so it
looks like a build problem rather than a filesystem one. Turbopack has no usable
polling fallback — `watchOptions.pollIntervalMs` exists but is incomplete
upstream, and the PR that would auto-enable polling in Docker was rejected, with
the maintainer pointing at the VirtioFS gap as the real cause.

On a Linux filesystem the watchers work natively and no polling settings are
needed anywhere — which is why `CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`,
`watchOptions` and `next dev --webpack` are all absent from this repo. If hot
reload ever dies, check where the working copy lives before touching any config.

**Windows is the verified case**: measured here, both before and after moving the
tree onto ext4. **macOS is untested.** The same failure is expected, because
Docker Desktop there also runs Linux in a VM behind VirtioFS and the Turbopack
maintainer named macOS alongside Windows — but nobody has reproduced it on a Mac
for this repo. Note that macOS has no WSL equivalent, so the fix there cannot be
"move the tree to Linux"; it would mean keeping dependencies in Docker volumes
and working through a Dev Container, or accepting webpack with polling.

## Quick start

```bash
docker compose up -d
```

That is the whole workflow, including after changing dependencies — see below.

### How dependencies work

`deps`, `api` and `web` run from one shared dev image (`docker/dev.Dockerfile`),
and `e2e` runs on the Playwright image. Both bases are glibc, so all four share a
single `node_modules` tree.

That tree lives on the bind mount, not in a Docker volume — which is what lets an
IDE index it directly. There are no `node_modules` volumes at all; the only named
volume left is `pgdata`.

Nothing is installed at image build time. A one-shot `deps` service runs
`pnpm install`, `prisma generate` and the `database` build on every `up`; the
other services wait for it via `service_completed_successfully`. This is
deliberate: a build-time install would go stale the moment the lockfile changes,
because the image layer is not rebuilt on `up`.

Practical consequence: after editing any `package.json`, just run
`docker compose up -d`. No rebuild, no volume juggling.

Source edits are live and NestJS/Next.js watch mode picks them up natively — no
polling settings anywhere, see the Linux filesystem rule above. There is no
`develop.watch` block either: Compose refuses to watch paths that are already
bind mounts, so it would be a no-op.

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
| `docker/dev.Dockerfile` | Shared dev image (deps, api, web) |
| `docker-compose.yml` | Dev environment definition |

## IDE setup

Open the project directly from the Linux filesystem — on Windows that means
WebStorm's WSL remote, pointed at `~/sync_sphere_calendar_app` inside the distro.
`node_modules` sit right there on disk, so type resolution works with no extra
setup and no Dev Container.

Two things that do **not** work, both tried:

- A JetBrains "Docker Compose" Node interpreter. It only *executes* processes; it
  does not feed type resolution, so TypeScript still reports
  `TS2307: Cannot find module 'react'`.
- Opening the tree from a Windows path. Besides breaking hot reload, it puts the
  working copy back on VirtioFS.

Do not run `pnpm install` on the host to populate `node_modules` — the `deps`
service does that inside a container, and its output is what lands on disk.
Running it natively would overwrite that tree with binaries built against the
host toolchain.

## Common tasks

```bash
# Install dependencies / regenerate Prisma / rebuild `database` (all three at once)
docker compose run --rm deps

# Prisma generate on its own
docker compose exec api pnpm prisma generate --schema=./packages/database/prisma/schema.prisma

# Prisma migrate
docker compose exec api pnpm prisma migrate dev --name <name> --schema=./packages/database/prisma/schema.prisma

# Run tests (see the Testing section below)
docker compose exec api pnpm --filter api test

# Lint
docker compose exec api pnpm run lint

# Apply package.json changes (re-runs the `deps` install)
docker compose up -d

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
- The `e2e` service sits behind the `test` Compose profile, so `docker compose up` never starts it. It waits for `web` to report healthy, then runs Playwright against `http://web:3000`.
- The Playwright image tag in `apps/e2e/Dockerfile` must match the `@playwright/test` version in `apps/e2e/package.json`.
- `e2e` shares the same bind-mounted `node_modules` as `deps`/`api`/`web`; it has
  no volumes of its own. Both base images are glibc — `node:20-bookworm-slim` for
  the dev image, Ubuntu for the Playwright image — so the native binaries are
  interchangeable. (The Alpine images under `apps/*/Dockerfile` are production
  builds and play no part in the dev stack.)
- E2E coverage is limited to unauthenticated pages. Google OAuth cannot be automated; testing `/dashboard` needs a JWT/`storageState` seeding strategy that does not exist yet.

## Cursor rules

Detailed guidance lives in `.cursor/rules/` — always-on and file-scoped
conventions (`docker-first`, `project-overview`, `nestjs-api`,
`nextjs-frontend`, `prisma-database`).

## Stack

Turborepo · pnpm · Next.js 16 · React 19 · NestJS 11 · Prisma 7 · PostgreSQL 16 · Tailwind · Shadcn UI · Google OAuth
