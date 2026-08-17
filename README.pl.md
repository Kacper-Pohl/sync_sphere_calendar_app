# SyncSphere

**[English](README.md)**

SyncSphere to nowoczesna aplikacja kalendarza i planera z integracją **Google Calendar**. Umożliwia przeglądanie wydarzeń, tworzenie spotkań, zarządzanie grupami zespołowymi i wysyłanie zaproszeń do członków grupy.

Monorepo oparte o **Turborepo** i **pnpm workspaces**, z pełnym środowiskiem deweloperskim w **Docker Compose**.

## Podgląd

| Strona główna | Dashboard | Kalendarz |
| ------------- | --------- | --------- |
| ![Strona główna](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Kalendarz](docs/screenshots/calendar.png) |

## Główne funkcje

| Funkcja | Opis |
| ------- | ---- |
| **Logowanie Google OAuth** | Uwierzytelnianie przez konto Google z zakresem dostępu do kalendarza |
| **Synchronizacja wydarzeń** | Pobieranie nadchodzących wydarzeń z Google Calendar (kalendarz główny) |
| **Tworzenie wydarzeń** | Dodawanie spotkań z opcjonalnym zaproszeniem członków grupy |
| **Dashboard** | Minimalistyczny podgląd nadchodzących wydarzeń |
| **Widok kalendarza** | Miesięczna siatka z wydarzeniami i szczegółami |
| **Grupy** | Tworzenie zespołów, dodawanie członków po e-mailu, limit 5 grup na użytkownika |
| **Zaproszenia** | Wysyłanie, akceptacja i odrzucanie zaproszeń na wydarzenia |
| **Powiadomienia** | Top bar z licznikiem oczekujących zaproszeń |

## Stack technologiczny

| Warstwa | Technologie |
| ------- | ----------- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v3, Shadcn UI, SWR, date-fns, Framer Motion |
| **Backend** | NestJS 11, Passport (Google OAuth + JWT), class-validator |
| **Baza danych** | PostgreSQL 16, Prisma 7 |
| **Integracje** | Google Calendar API (googleapis) |
| **Infrastruktura** | Docker Compose |
| **Monorepo** | Turborepo, pnpm 9, TypeScript 5.9 |

## Architektura

```
Przeglądarka → web (Next.js :3000) → api (NestJS :3001) → db (PostgreSQL :5432)
                                    ↘ Google Calendar API (OAuth)
```

## Status projektu

Aktywnie rozwijany projekt poboczny. Wszystko z sekcji **Główne funkcje**
działa end to end i jest pokryte testami opisanymi niżej; interfejsy mogą się
jeszcze zmieniać między commitami, więc traktuj to jako działający prototyp,
a nie otagowane wydanie.

## Planowane ulepszenia

- [ ] **Szersze pokrycie API** — serwisy są przetestowane; kontrolery i integracja z Google Calendar jeszcze nie
- [ ] **Scenariusze E2E po zalogowaniu** — Playwright jest wdrożony, ale pokrycie kończy się na stronach bez logowania; Google OAuth nie da się zautomatyzować, więc kalendarz i grupy wymagają strategii wstrzykiwania JWT
- [ ] **Internacjonalizacja (i18n)** — kody tłumaczeń zamiast hardcodowanych stringów w UI
- [ ] **Tryb jasny (light mode)** — obecnie dostępny jest wyłącznie dark mode (paleta zinc + butelkowa zieleń)
- [ ] **Strona ustawień** — link w sidebarze istnieje, widok w przygotowaniu
- [ ] **Produkcyjny deployment** — konfiguracja CI/CD i hostingu
- [ ] **I inne** — kolejne ulepszenia w miarę rozwoju projektu

## Struktura katalogów

```
apps/web/              → frontend Next.js (port 3000)
apps/api/              → backend NestJS (port 3001)
apps/e2e/              → testy end-to-end (Playwright)
packages/database/     → schemat Prisma, klient, migracje
packages/tsconfig/     → współdzielone konfiguracje TypeScript
docker/dev.Dockerfile  → wspólny obraz deweloperski (deps, api, web)
docker-compose.yml     → środowisko deweloperskie
docs/screenshots/      → podglądy UI
```

## Wymagania

- **Docker** i **Docker Compose**
- Konto Google Cloud z skonfigurowanym OAuth 2.0
- Plik `.env` w katalogu głównym (wzorzec: [`.env.example`](.env.example))

## Szybki start

1. Sklonuj repozytorium i utwórz `.env` na podstawie `.env.example`.
2. Uzupełnij `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` i `JWT_SECRET`.
3. Uruchom stack:

```bash
docker compose up -d
```

4. Otwórz [http://localhost:3000](http://localhost:3000) i zaloguj się przez Google.

Ta jedna komenda to cały workflow, również po zmianie zależności — jednorazowy
serwis `deps` przy każdym `up` przeinstalowuje je i przebudowuje.

## Konfiguracja środowiska

```env
DATABASE_URL=postgresql://devuser:devpassword@db:5432/calendar_db?schema=public
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`docker-compose.yml` nadpisuje `DATABASE_URL` dla kontenerów. Zmienne OAuth i JWT są wczytywane z `.env`.

## Dostęp po uruchomieniu

| Zasób | URL |
| ----- | --- |
| Frontend | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Kalendarz | http://localhost:3000/dashboard/calendar |
| Grupy | http://localhost:3000/dashboard/groups |
| Logowanie Google | http://localhost:3001/auth/google |
| API | http://localhost:3001 |

## API (skrót)

| Endpoint | Opis |
| -------- | ---- |
| `GET /auth/google` | Rozpoczęcie logowania Google |
| `GET /calendar/events` | Lista wydarzeń (JWT) |
| `POST /calendar/events` | Nowe wydarzenie, opcjonalnie z `groupId` (JWT) |
| `DELETE /calendar/events/:eventId` | Usunięcie wydarzenia (JWT) |
| `GET /groups` | Lista grup użytkownika (JWT) |
| `POST /groups` | Utworzenie grupy (JWT) |
| `POST /groups/:id/members` | Dodanie członka po e-mailu (JWT) |
| `DELETE /groups/:id/members/:memberId` | Usunięcie członka (JWT) |
| `DELETE /groups/:id/leave` | Opuszczenie grupy (JWT) |
| `DELETE /groups/:id` | Usunięcie grupy (JWT) |
| `GET /invitations/pending` | Oczekujące zaproszenia (JWT) |
| `POST /invitations/:id/accept` | Akceptacja zaproszenia (JWT) |
| `POST /invitations/:id/decline` | Odrzucenie zaproszenia (JWT) |

## Typowe komendy

Wszystkie polecenia uruchamiaj z katalogu głównego repozytorium.

```bash
# Instalacja zależności, regeneracja Prismy i przebudowa `database` (naraz)
docker compose run --rm deps

# Prisma — generowanie klienta
docker compose exec api pnpm prisma generate --schema=./packages/database/prisma/schema.prisma

# Prisma — migracja (dev)
docker compose exec api pnpm prisma migrate dev --name <nazwa> \
  --schema=./packages/database/prisma/schema.prisma \
  --config=./packages/database/prisma.config.ts

# Lint
docker compose exec api pnpm run lint
docker compose exec web pnpm --filter web lint

# Logi
docker compose logs -f api
```

## Testy

Trzy warstwy, każda uruchamiana w kontenerze:

| Warstwa | Lokalizacja | Runner | Komenda |
| ------- | ----------- | ------ | ------- |
| Backend, jednostkowe | `apps/api/` | Jest | `docker compose exec api pnpm --filter api test` |
| Frontend, jednostkowe | `apps/web/` | Vitest | `docker compose exec web pnpm --filter web test` |
| End-to-end | `apps/e2e/` | Playwright | `docker compose --profile test run --rm e2e` |

Serwis `e2e` jest za profilem Compose `test`, więc zwykłe `docker compose up`
nigdy go nie uruchamia.

Co jest pokryte:

- **Backend** — reguły autoryzacji w `GroupsService` i `InvitationsService`:
  sprawdzanie własności przy każdej mutacji, limit 5 posiadanych grup, zakaz
  opuszczenia własnej grupy przez właściciela i odrzucanie zaproszenia, na które
  już odpowiedziano.
- **Frontend** — funkcja `cn`, formatter błędów API oraz fetcher SWR (doklejanie
  tokenu i propagacja błędu), plus test interakcji z komponentem `Button`.
- **End-to-end** — strona główna i strona 404, z zablokowanymi wszystkimi
  żądaniami do zewnętrznych hostów, żeby zestaw nie zależał od sieci.

Scenariusze po zalogowaniu nie są pokryte end to end: Google OAuth nie da się
zautomatyzować, więc dotarcie do `/dashboard` wymaga strategii wstrzykiwania
JWT, której jeszcze nie ma.

> Projekt działa **wyłącznie w Dockerze**. Nie uruchamiaj `pnpm`, `prisma`, `nest` ani `next` bezpośrednio na hoście.

Szczegółowe instrukcje dla deweloperów i agentów AI: [`AGENTS.md`](./AGENTS.md).

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
| ------- | ----------- |
| `Module not found` po dodaniu paczki | `docker compose up -d` — ponownie uruchamia instalację w `deps` |
| Brak tabel w bazie | `docker compose exec api pnpm prisma db push --schema=./packages/database/prisma/schema.prisma --config=./packages/database/prisma.config.ts` |
| Zmiany w plikach nie wywołują przebudowy | Na Windowsie sklonuj repozytorium wewnątrz WSL2, a nie na `C:\` — szczegóły w [`AGENTS.md`](./AGENTS.md) |
| `node_modules` wyglądają na uszkodzone | `docker compose run --rm deps` przeinstaluje. Nie uruchamiaj `pnpm install` na hoście — nadpisze drzewo binariami zbudowanymi pod host. |

## Licencja

Projekt jest udostępniany na licencji [MIT](LICENSE).
