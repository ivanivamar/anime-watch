# CLAUDE.md

This file gives Claude Code persistent context for this project. Read it at the start of every session and follow it. When the user asks for something that conflicts with this file, point out the conflict before making the change.

## Project

A personal anime streaming web app for a single household. One user, local-first, no public deployment. Files live on an external drive; the app reads them, streams them to a browser, tracks watch progress.

This is a hobby project, not production software. Optimize for clarity, simplicity, and being able to come back after a month and remember what's going on. Do not over-engineer.

## Stack

- **Frontend**: Angular 21+, standalone components, TypeScript strict mode, RxJS where it makes sense (don't force it for trivial state)
- **Backend**: Node.js + Express, TypeScript strict mode, ES modules
- **Database**: SQLite via `better-sqlite3` (synchronous API, fine for single-user)
- **Video tooling**: `ffmpeg` / `ffprobe` via `fluent-ffmpeg` for metadata extraction and any future transcoding
- **Package manager**: npm
- **Node version**: 20 LTS or newer

No Docker, no Kubernetes, no microservices. Two processes: the Express backend and the Angular dev server.

## Repo layout

```
/backend           Express API
  /src
    /routes        Route handlers, one file per resource
    /services      Business logic, no Express knowledge
    /db            SQLite connection, migrations, queries
    /middleware    Express middleware
    /types         Shared TypeScript types
    server.ts      Entry point
  package.json
  tsconfig.json
  .env.example

/frontend          Angular app
  /src/app
    /core          Singleton services, interceptors, guards
    /features      One folder per feature (library, watch, show-detail)
    /shared        Reusable components, pipes, directives
    app.config.ts
    app.routes.ts
  package.json
  angular.json

/scripts           One-off utilities (library scanner, db reset, etc.)
README.md
CLAUDE.md          This file
.gitignore
```

## Conventions

### TypeScript

- `strict: true` in both tsconfigs, no exceptions
- No `any`. If a type is genuinely unknown, use `unknown` and narrow it
- Prefer `type` for unions and primitives, `interface` for object shapes that might be extended
- Explicit return types on exported functions

### Backend

- Routes are thin: parse input, call a service, return the result
- Services contain logic and are testable without Express
- DB access goes through `/db` modules, never inline in routes
- All endpoints under `/api`
- Errors throw, a global error middleware turns them into JSON responses
- Use async/await; only use callbacks where a library forces it

### Frontend

- Standalone components only, no NgModules
- One feature per folder under `/features`
- Services use `providedIn: 'root'` for app-wide singletons, otherwise scope to a feature
- HTTP via `HttpClient`, not `fetch`
- Routing via the Router, lazy-load feature routes when they grow
- Styling: component-scoped CSS, no global stylesheets beyond resets and CSS variables
- No state management library yet (NgRx, signals store, etc.). Plain services + signals are enough until proven otherwise

### Naming

- Files: `kebab-case.ts` (e.g. `watch-progress.service.ts`)
- Classes / components: `PascalCase`
- Functions / variables: `camelCase`
- DB tables: `snake_case`, plural (`shows`, `episodes`, `watch_progress`)
- DB columns: `snake_case`

## Media library layout

The scanner expects this structure under `MEDIA_ROOT`:

```
/media/anime/
  Frieren - Beyond Journey's End (2023)/
    Season 01/
      S01E01 - The Journey's End.mkv
      S01E02 - The Priest's Lie.mkv
  Spy x Family (2022)/
    Season 01/
      S01E01 - Operation Strix.mkv
```

Show folder format: `Show Name (Year)`
Season folder format: `Season XX` (zero-padded)
Episode file format: `SXXEYY - Title.ext` (ext: mkv, mp4, webm)

If a file doesn't match this pattern, the scanner logs and skips. It does not guess.

## Database schema

```sql
CREATE TABLE shows (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  poster_path TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE episodes (
  id INTEGER PRIMARY KEY,
  show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  title TEXT,
  file_path TEXT NOT NULL UNIQUE,
  duration_seconds INTEGER,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(show_id, season, episode)
);

CREATE TABLE watch_progress (
  episode_id INTEGER PRIMARY KEY REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_episodes_show ON episodes(show_id, season, episode);
```

Migrations go in `/backend/src/db/migrations/`, numbered (`001_init.sql`, `002_...sql`). The DB module runs them in order on startup, tracking applied ones in a `_migrations` table.

## API surface

Stable endpoints, version any breaking changes by adding new routes rather than mutating these:

- `GET /api/shows` — list all shows with episode counts
- `GET /api/shows/:id` — show detail with episode list
- `GET /api/episodes/:id` — single episode metadata
- `GET /api/stream/:episodeId` — video stream, supports Range requests, returns 206 for partial, 200 for full, 416 for invalid ranges
- `GET /api/thumbnail/:episodeId` — poster or thumbnail (404 if missing, no placeholder served by API)
- `POST /api/progress` — `{ episodeId, position_seconds }`, upserts a row
- `GET /api/progress/:episodeId` — current progress for resume

Range request handling is non-negotiable. Without it, video seeking breaks. Verify after any change to the streaming route.

## Environment variables

`/backend/.env`:

```
PORT=3000
MEDIA_ROOT=/absolute/path/to/media/anime
DB_PATH=./data/library.db
```

Never commit `.env`. Always update `.env.example` when adding a variable.

## What "done" means for a feature

A feature is done when:

1. The code matches the conventions above
2. It runs without errors (`npm run dev` in both folders, no console errors)
3. The user-facing behavior was verified end-to-end, not just by reading the code
4. Any new env var is in `.env.example`
5. Any new dependency is justified (no adding lodash for one helper)

## What to ask before doing

Stop and ask the user if:

- A request would change the schema, the folder layout, or the API surface
- A request would add a major dependency (a UI library, a state manager, an auth system)
- A request seems to conflict with this file
- The right approach isn't obvious and there are 2+ reasonable options

Don't ask before:

- Writing standard CRUD code that fits the conventions
- Fixing obvious bugs
- Adding tests for code you just wrote

## Working style

- Plan before coding on anything beyond a small change. Outline files you'll touch and the approach, wait for approval, then code
- Stop after each logical chunk and show what you did. Don't chain three features in one go
- When something doesn't work, run it, read the actual error, then fix. Don't guess
- Prefer editing existing files over creating new ones unless the new file genuinely belongs
- Don't write tests unless asked or unless the code is tricky enough to warrant them. This is a hobby project; not everything needs coverage
- Don't add comments that restate the code. Comment the *why*, not the *what*

## Current status

(Update this section as the project progresses.)

- [x] Backend scaffold + Express + SQLite + migrations runner
- [x] Frontend scaffold + Angular + routing
- [x] Streaming endpoint with Range support
- [x] Library scanner script
- [x] Library page (grid of shows)
- [x] Show detail page (episode list)
- [x] Watch page with native player + progress tracking
- [x] Continue watching row on library page
- [x] Auto-play next episode

## Out of scope (for now)

Don't build these unless the user explicitly asks:

- Auth / multi-user support
- Remote access (Tailscale, Cloudflare Tunnel) — that's an infra step, not a code step
- Transcoding pipelines (assume files are already in browser-playable formats; if not, the user converts them with ffmpeg manually)
- Subtitle handling beyond what the native `<video>` element gives for free
- A custom video player UI
- Cloud storage backends
- Mobile apps
- Recommendations, ratings, anything social