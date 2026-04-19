# SyncSphere - Kalendarz i Planner (Monorepo)

Nowoczesna aplikacja do zarządzania wydarzeniami zintegrowana z kalendarzem Google. Projekt zbudowany został w oparciu o architekturę **Turborepo** (Monorepo) przy wykorzystaniu ekosystemu Node.js.

## Technologia

- **Frontend:** Next.js 15 (App Router), Tailwind CSS v3, Shadcn UI, Lucide React, date-fns
- **Backend:** NestJS
- **Baza Danych:** PostgreSQL, Prisma ORM
- **Infrastruktura:** Docker, Docker Compose
- **Zarządzanie pakietami:** Pnpm

## Struktura Katalogów

Projekt korzysta z Turborepo i posiada następujący podział:
- `apps/web` - Aplikacja frontendowa (Next.js), dostępna pod adresem http://localhost:3000
- `apps/api` - Aplikacja backendowa (NestJS), odpytująca kalendarz Google, dostępna pod adresem http://localhost:3001
- `packages/database` - Współdzielony konfigurator bazy danych Prisma (Schema i Migracje).
- `packages/tsconfig` - Współdzielone konfiguracje TypeScript.

## Wymagania
Aby uruchomić aplikację potrzebujesz jedynie zainstalowanego silnika **Docker** i oprogramowania **Docker Compose**. 

## Uruchamianie Projektu (Środowisko Deweloperskie)

Projekt jest w pełni scentralizowany wokół skryptów Dockera, które automatycznie instalują paczki (`pnpm install`), generują klienta Prisma dla bazy danych i uruchamiają system w trybie śledzenia zmian (watch mode).

1. **Plik Zmiennych Środowiskowych**
Upewnij się, że w głównym katalogu znajduje się poprawnie wypełniony plik `.env` zawierający przynajmniej:
```env
DATABASE_URL="postgresql://devuser:devpassword@db:5432/calendar_db?schema=public"
# + Konfiguracja OAuth dla Google Calendar
```

2. **Budowa i Start**
Aby uruchomić wszystkie środowiska w tle, wykonaj poniższe polecenie w głównym katalogu projektu:
```bash
docker compose up -d
```
Jeśli zmieniono `package.json` lub dodano nowe paczki w systemie Windows – zrestartuj główne środowisko programistyczne:
```bash
docker compose restart dev-environment
```

3. **Logi Systemowe**
Aby śledzić na żywo to co dzieje się po stronie backendu i w bundlerze Next.js:
```bash
docker logs -f calendar_dev
```

4. **Wyłączenie Aplikacji**
```bash
docker compose down
```

## Dostęp Po Włączeniu
Po całkowitym zbudowaniu kontenerów:
- Frontend: **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**
- Połączenie autoryzacyjne: **http://localhost:3001/auth/google**
- Baza Danych: `localhost:5432` 

## Uwagi dla programistów:
Aplikacja została zaprojektowana w schemacie estetycznym **Dark Mode** przy wykorzystaniu barw mrocznego cynku (Zinc) i butelkowej zieleni dla elementów aktywnych. Przy dodawaniu nowych komponentów polegamy na stylach i pakiecie w `apps/web/components/ui/` (Shadcn UI).
