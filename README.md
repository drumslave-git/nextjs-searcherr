# nextjs-searcherr

`nextjs-searcherr` is a Next.js app for searching TMDB and adding selected titles to an *arr stack. It stores configured apps and the TMDB API key in a local SQLite database managed by Prisma.

This project was formerly known as `nextjs-mergerr` and has been rebranded to `nextjs-searcherr`.

## Features

- Search TMDB for movies and view title details, artwork, ratings, and release metadata.
- Configure one or more *arr applications with URL and API key credentials.
- Test app connectivity before saving a configuration.
- Add TMDB titles to a configured app through the app API.
- Store local configuration in `config/data.db`.
- Run locally with Next.js or through Docker Compose.

## Tech Stack

- Next.js 15 with the App Router
- React 19
- Material UI
- Prisma
- SQLite
- Docker

## Requirements

- Node.js compatible with the project dependencies
- npm
- A TMDB API key
- At least one reachable *arr app, such as Radarr or Whisparr

## Local Development

Install dependencies:

```bash
npm install
```

Create or update the local SQLite database and generate the Prisma client:

```bash
npm run db:push
npm run db:generate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

Start the production-style container:

```bash
docker compose up --build
```

Start the development container:

```bash
docker compose -f compose.dev.yml up --build
```

Both compose files mount `./config` into the container so the SQLite database persists outside the image.

## Configuration

1. Open the app in your browser.
2. Go to `Settings` and save your TMDB API key.
3. Go to `Home`, choose `Add App`, and enter:
   - `Name`: display name for the app
   - `Url`: internal API URL for the app
   - `Public Url`: optional browser-facing URL
   - `Api Key`: app API key
4. Use `Test` to verify connectivity, then save.
5. Open the app search page and add titles from TMDB.

## Scripts

- `npm run dev`: run the Next.js dev server with Turbopack.
- `npm run wp:dev`: run the Next.js dev server without Turbopack.
- `npm run build`: create a production build.
- `npm run start`: run the standalone production server.
- `npm run lint`: run Next.js linting.
- `npm run lint:fix`: run linting with automatic fixes.
- `npm run db:push`: sync the Prisma schema to SQLite.
- `npm run db:generate`: generate the Prisma client.
- `npm run db:studio`: open Prisma Studio.
- `npm run dev:all`: run the app and Prisma Studio together.

## Project Structure

- `src/app`: Next.js routes and API handlers.
- `src/components`: UI components and providers.
- `src/common/api`: TMDB and *arr API clients.
- `src/middleware`: request middleware for TMDB and app API access.
- `prisma/schema.prisma`: database schema.
- `config/data.db`: local SQLite database, created at runtime.

## Notes

- Keep API keys private and do not commit local database files.
- The production Docker image runs as a non-root user and initializes the SQLite database on first start.
