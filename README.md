# SyncSphere — Kalendarz i Planner (Monorepo)

Nowoczesna aplikacja do zarządzania wydarzeniami zintegrowana z Google Calendar. Projekt oparty o architekturę **Turborepo** (monorepo) i ekosystem Node.js.

## Funkcje

- Logowanie przez **Google OAuth**
- Synchronizacja wydarzeń z **Google Calendar**
- **Grupy** — tworzenie zespołów i dodawanie członków
- **Zaproszenia** — wysyłanie zaproszeń na wydarzenia do członków grupy
- Dashboard, widok kalendarza i powiadomienia o oczekujących zaproszeniach

## Technologia

| Warstwa | Stack |
| -------- | ----- |
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v3, Shadcn UI, SWR, date-fns |
| Backend | NestJS 11, Passport (Google OAuth + JWT) |
| Baza danych | PostgreSQL 16, Prisma 7 |
| Infrastruktura | Docker Compose |
| Monorepo | Turborepo, pnpm workspaces |

## Struktura katalogów

```
apps/web/              → frontend Next.js (port 3000)
apps/api/              → backend NestJS (port 3001)
packages/database/     → schemat Prisma, klient, migracje
packages/tsconfig/     → współdzielone konfiguracje TypeScript
docker-compose.yml     → środowisko deweloperskie
```

## Wymagania

- **Docker** i **Docker Compose**
- Plik `.env` w katalogu głównym repozytorium (nie jest commitowany)

## Konfiguracja środowiska

Utwórz plik `.env` w katalogu głównym:

```env
# Baza danych (w kontenerach host to `db`, nie `localhost`)
DATABASE_URL=postgresql://devuser:devpassword@db:5432/calendar_db?schema=public

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# JWT
JWT_SECRET=

# URL frontendu (redirect po logowaniu)
FRONTEND_URL=http://localhost:3000
```

`docker-compose.yml` nadpisuje `DATABASE_URL` dla kontenerów `api` i `web`. Zmienne OAuth i JWT są wczytywane z `.env` przez `env_file`.

## Uruchamianie (Docker)

Projekt działa **wyłącznie w Dockerze**. Nie uruchamiaj `pnpm`, `prisma`, `nest` ani `next` bezpośrednio na hoście.

### Start deweloperski (zalecane)

Tryb watch synchronizuje pliki i przebudowuje kontenery po zmianie zależności:

```bash
docker compose watch
```

Alternatywy:

```bash
docker compose up --watch    # start z watch w tle terminala
docker compose up -d         # start bez watch (bind mount nadal działa)
```

### Kontenery

| Serwis | Kontener | Port | Opis |
| ------ | -------- | ---- | ---- |
| `db` | `calendar_db` | 5432 | PostgreSQL |
| `api` | `calendar_api` | 3001 | NestJS API |
| `web` | `calendar_web` | 3000 | Next.js frontend |

### Logi

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

### Zatrzymanie

```bash
docker compose down              # zatrzymaj kontenery
docker compose down -v           # zatrzymaj + usuń wolumen bazy (utrata danych)
```

## Docker Compose Watch

`develop.watch` w `docker-compose.yml` obsługuje hot reload bez ręcznego rebuildu:

| Akcja | Kiedy | Efekt |
| ----- | ----- | ----- |
| `sync` | Zmiana plików źródłowych | Kopiuje pliki do kontenera; Nest/Next przeładowują się |
| `rebuild` | Zmiana `package.json` / `pnpm-lock.yaml` | Przebudowuje obraz i restartuje kontener |

**API** — sync: `apps/api/src`, `packages/` · rebuild: `package.json`, `apps/api/package.json`, `pnpm-lock.yaml`

**Web** — sync: `apps/web/app`, `components`, `lib`, `public` · rebuild: `package.json`, `apps/web/package.json`, `tailwind.config.ts`, `next.config.mjs`, `pnpm-lock.yaml`

Na Windows włączone jest polling (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`) dla niezawodnego wykrywania zmian.

## Typowe komendy

Wszystkie polecenia uruchamiaj z **katalogu głównego** repozytorium.

### Zależności

```bash
# Instalacja w monorepo (domyślnie z kontenera api)
docker compose exec api pnpm install

# Po zmianie package.json — przebudowa obrazów
docker compose up -d --build api web

# Frontend ma osobny wolumen node_modules — po dodaniu paczek web:
docker compose exec web pnpm install
```

### Prisma i baza danych

```bash
# Generowanie klienta Prisma
docker compose exec api pnpm prisma generate \
  --schema=./packages/database/prisma/schema.prisma

# Migracja (dev)
docker compose exec api pnpm prisma migrate dev \
  --name <nazwa> \
  --schema=./packages/database/prisma/schema.prisma \
  --config=./packages/database/prisma.config.ts

# Synchronizacja schematu bez migracji (szybkie dev)
docker compose exec api pnpm prisma db push \
  --schema=./packages/database/prisma/schema.prisma \
  --config=./packages/database/prisma.config.ts

# Shell PostgreSQL
docker compose exec db psql -U devuser -d calendar_db
```

### Build, testy, lint

```bash
docker compose exec api pnpm --filter api run build
docker compose exec api pnpm run lint
docker compose exec api pnpm --filter api test

docker compose exec web pnpm --filter web lint
docker compose exec web pnpm --filter web build
```

> Uwaga: `docker compose exec api pnpm run build` (bez `--filter`) uruchamia skrypt z korzenia repo (`turbo run build`), który przez Turborepo przebudowuje **wszystkie** pakiety monorepo, w tym `apps/web` — zawsze scope'uj do konkretnego pakietu z `--filter`, żeby uniknąć niepotrzebnego (i wolniejszego) budowania frontendu przy pracy nad samym API.

### Produkcja (obraz Docker)

```bash
docker compose build --no-cache web    # build Next.js (wymaga NODE_ENV=production w Dockerfile)
docker compose up -d --build api web
```

## Dostęp po uruchomieniu

| Zasób | URL |
| ----- | --- |
| Frontend (dashboard) | http://localhost:3000/dashboard |
| Grupy | http://localhost:3000/dashboard/groups |
| Kalendarz | http://localhost:3000/dashboard/calendar |
| Logowanie Google | http://localhost:3001/auth/google |
| API | http://localhost:3001 |
| PostgreSQL | `localhost:5432` (user: `devuser`, db: `calendar_db`) |

## API (skrót)

| Endpoint | Opis |
| -------- | ---- |
| `GET /auth/google` | Rozpoczęcie logowania Google |
| `GET /calendar/events` | Lista wydarzeń (JWT) |
| `POST /calendar/events` | Nowe wydarzenie, opcjonalnie z `groupId` (JWT) |
| `GET /groups` | Lista grup użytkownika (JWT) |
| `POST /groups` | Utworzenie grupy (JWT) |
| `POST /groups/:id/members` | Dodanie członka po e-mailu (JWT) |
| `GET /invitations/pending` | Oczekujące zaproszenia (JWT) |

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
| ------- | ----------- |
| `Module not found` po dodaniu paczki | `docker compose exec web pnpm install` lub `docker compose up -d --build web` |
| Prisma: brak tabel (`Group`, `EventInvitation`) | `docker compose exec api pnpm prisma db push --schema=./packages/database/prisma/schema.prisma --config=./packages/database/prisma.config.ts` |
| Build web pada na `/_document` | Upewnij się, że nie ma katalogu `apps/web/pages/` (tylko App Router) |
| Ostrzeżenie `non-standard "NODE_ENV"` przy budowaniu | `apps/web` samo wymusza `NODE_ENV=production` w skrypcie `build` — użyj `docker compose exec api pnpm --filter api run build`, żeby budować tylko API bez kaskadowego budowania frontendu przez Turborepo |
| Stare `node_modules` w wolumenie | `docker compose down` → usuń wolumeny `calendar_app_*_node_modules` → `docker compose up -d --build` |
| Zmiany plików nie widać na Windows | Użyj `docker compose watch`; polling jest włączony w compose |

## Uwagi dla programistów

- UI w trybie **dark mode** — paleta zinc + butelkowa zieleń (`primary`). Nowe komponenty bazuj na Shadcn UI z `apps/web/components/ui/`.
- Autoryzacja JWT jest obsługiwana centralnie przez `AuthProvider` w layoucie dashboardu — zapytania SWR czekają na gotową sesję.
- Szczegółowe instrukcje dla agentów AI: [`AGENTS.md`](./AGENTS.md).
