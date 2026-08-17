# SyncSphere

**[Polski](README.pl.md)**

SyncSphere is a modern calendar and planner app with **Google Calendar** integration. It lets you browse events, create meetings, manage team groups, and send invitations to group members.

Built as a **Turborepo** monorepo with **pnpm workspaces** and a full **Docker Compose** development environment.

## Preview

| Landing page | Dashboard | Calendar |
| ------------ | --------- | -------- |
| ![Landing page](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Calendar](docs/screenshots/calendar.png) |

## Key features

| Feature | Description |
| ------- | ----------- |
| **Google OAuth login** | Authentication via Google account with calendar scope |
| **Event sync** | Fetch upcoming events from Google Calendar (primary calendar) |
| **Event creation** | Create meetings with optional group member invitations |
| **Dashboard** | Minimal overview of upcoming events |
| **Calendar view** | Monthly grid with events and details |
| **Groups** | Create teams, add members by email, limit of 5 groups per user |
| **Invitations** | Send, accept, and decline event invitations |
| **Notifications** | Top bar with pending invitation counter |

## Tech stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v3, Shadcn UI, SWR, date-fns, Framer Motion |
| **Backend** | NestJS 11, Passport (Google OAuth + JWT), class-validator |
| **Database** | PostgreSQL 16, Prisma 7 |
| **Integrations** | Google Calendar API (googleapis) |
| **Infrastructure** | Docker Compose |
| **Monorepo** | Turborepo, pnpm 9, TypeScript 5.9 |

## Architecture

```
Browser → web (Next.js :3000) → api (NestJS :3001) → db (PostgreSQL :5432)
                               ↘ Google Calendar API (OAuth)
```

## Project status

Actively developed side project. Everything under **Key features** works end to
end and is covered by the test suites described below; interfaces may still
change between commits, so treat this as a working prototype rather than a
tagged release.

## Planned improvements

- [ ] **Wider API coverage** — the services are tested; controllers and the Google Calendar integration are not yet
- [ ] **Authenticated E2E flows** — Playwright is in place, but coverage stops at unauthenticated pages; Google OAuth cannot be automated, so calendar and groups flows need a JWT seeding strategy
- [ ] **Internationalization (i18n)** — translation keys instead of hardcoded UI strings
- [ ] **Light mode** — only dark mode is available today (zinc palette + bottle green accents)
- [ ] **Settings page** — sidebar link exists, view is not implemented yet
- [ ] **Production deployment** — CI/CD and hosting setup
- [ ] **And more** — ongoing improvements as the project evolves

## Directory layout

```
apps/web/              → Next.js frontend (port 3000)
apps/api/              → NestJS backend (port 3001)
apps/e2e/              → Playwright end-to-end tests
packages/database/     → Prisma schema, client, migrations
packages/tsconfig/     → shared TypeScript configs
docker/dev.Dockerfile  → shared dev image (deps, api, web)
docker-compose.yml     → development environment
docs/screenshots/      → UI previews
```

## Requirements

- **Docker** and **Docker Compose**
- Google Cloud account with OAuth 2.0 configured
- `.env` file in the repository root (template: [`.env.example`](.env.example))

## Quick start

1. Clone the repository and create `.env` from `.env.example`.
2. Fill in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `JWT_SECRET`.
3. Start the stack:

```bash
docker compose up -d
```

4. Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

That single command is the whole workflow, including after changing
dependencies — a one-shot `deps` service reinstalls and rebuilds on every `up`.

## Environment variables

```env
DATABASE_URL=postgresql://devuser:devpassword@db:5432/calendar_db?schema=public
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`docker-compose.yml` overrides `DATABASE_URL` for containers. OAuth and JWT variables are loaded from `.env`.

## URLs after startup

| Resource | URL |
| -------- | --- |
| Frontend | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Calendar | http://localhost:3000/dashboard/calendar |
| Groups | http://localhost:3000/dashboard/groups |
| Google login | http://localhost:3001/auth/google |
| API | http://localhost:3001 |

## API overview

| Endpoint | Description |
| -------- | ----------- |
| `GET /auth/google` | Start Google login |
| `GET /calendar/events` | List events (JWT) |
| `POST /calendar/events` | Create event, optionally with `groupId` (JWT) |
| `DELETE /calendar/events/:eventId` | Delete event (JWT) |
| `GET /groups` | List user groups (JWT) |
| `POST /groups` | Create group (JWT) |
| `POST /groups/:id/members` | Add member by email (JWT) |
| `DELETE /groups/:id/members/:memberId` | Remove member (JWT) |
| `DELETE /groups/:id/leave` | Leave group (JWT) |
| `DELETE /groups/:id` | Delete group (JWT) |
| `GET /invitations/pending` | Pending invitations (JWT) |
| `POST /invitations/:id/accept` | Accept invitation (JWT) |
| `POST /invitations/:id/decline` | Decline invitation (JWT) |

## Common commands

Run all commands from the repository root.

```bash
# Install dependencies, regenerate Prisma and rebuild `database` (all at once)
docker compose run --rm deps

# Prisma — generate client
docker compose exec api pnpm prisma generate --schema=./packages/database/prisma/schema.prisma

# Prisma — migration (dev)
docker compose exec api pnpm prisma migrate dev --name <name> \
  --schema=./packages/database/prisma/schema.prisma \
  --config=./packages/database/prisma.config.ts

# Lint
docker compose exec api pnpm run lint
docker compose exec web pnpm --filter web lint

# Logs
docker compose logs -f api
```

## Tests

Three layers, each run inside a container:

| Layer | Location | Runner | Command |
| ----- | -------- | ------ | ------- |
| Backend unit | `apps/api/` | Jest | `docker compose exec api pnpm --filter api test` |
| Frontend unit | `apps/web/` | Vitest | `docker compose exec web pnpm --filter web test` |
| End-to-end | `apps/e2e/` | Playwright | `docker compose --profile test run --rm e2e` |

The `e2e` service sits behind the `test` Compose profile, so a normal
`docker compose up` never starts it.

What is covered:

- **Backend** — the authorization rules in `GroupsService` and
  `InvitationsService`: ownership checks on every mutation, the five-group
  ownership limit, refusing to let an owner leave their own group, and rejecting
  an invitation that was already answered.
- **Frontend** — the `cn` class merger, the API error formatter, and the SWR
  fetcher (bearer token attachment and error propagation), plus a `Button`
  interaction test.
- **End-to-end** — the landing page and the 404 page, with all third-party
  requests blocked so the suite never depends on the network.

Authenticated flows are not covered end to end: Google OAuth cannot be
automated, so reaching `/dashboard` needs a JWT seeding strategy that does not
exist yet.

> The project runs **entirely in Docker**. Do not run `pnpm`, `prisma`, `nest`, or `next` directly on the host.

Developer and AI agent instructions: [`AGENTS.md`](./AGENTS.md).

## Troubleshooting

| Issue | Solution |
| ----- | -------- |
| `Module not found` after adding a package | `docker compose up -d` — this re-runs the `deps` install |
| Missing database tables | `docker compose exec api pnpm prisma db push --schema=./packages/database/prisma/schema.prisma --config=./packages/database/prisma.config.ts` |
| Edits do not trigger a rebuild | On Windows, clone the repository inside WSL2 rather than on `C:\` — see [`AGENTS.md`](./AGENTS.md) |
| `node_modules` look stale or broken | `docker compose run --rm deps` to reinstall. Do not run `pnpm install` on the host: it would overwrite the tree with host-built binaries. |

## License

This project is licensed under the [MIT License](LICENSE).
