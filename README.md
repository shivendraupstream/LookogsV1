# Lookogs

A self-hosted log management platform with core APM metrics and
alerting — built to replace AppSignal's logging + basic monitoring
subscription for Upstream Tech.

**Stack:** Node.js, TypeScript, Fastify, Prisma, PostgreSQL, React, Docker

---

## What's in this repo

```
Lookogs/
├── backend/          Fastify API server
├── frontend/         React dashboard
├── docker-compose.yml
├── .github/workflows/ci.yml   Lint + build checks on every push/PR
├── SETUP.md          Fresh-machine setup, troubleshooting
├── INTEGRATION.md    How to connect YOUR OWN app to send logs here
└── README.md         This file — exact run instructions
```

---

## Prerequisites

- **Node.js 22+**
- **Docker Desktop** — must be open and running before starting Postgres
- **Git**

---

## First-time setup (do this once per machine)

### 1. Clone the repo
```cmd
git clone <your-repo-url>
cd Lookogs
```

### 2. Create environment files

Two `.env` files are needed — neither is committed to Git.

**Root `.env`** (same folder as `docker-compose.yml`):
```cmd
copy .env.example .env
```
```
POSTGRES_USER=your_chosen_username
POSTGRES_PASSWORD=your_chosen_password
POSTGRES_DB=lookogs_logs
REDIS_PORT=6379
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=changeme
```
*(Redis and pgAdmin run locally for convenience but are not currently
used by any application code, and are not deployed to production.)*

**`backend/.env`:**
```cmd
cd backend
copy .env.example .env
```
```
DATABASE_URL="postgresql://your_chosen_username:your_chosen_password@localhost:5433/lookogs_logs"
ADMIN_USERNAME=pick_a_dashboard_username
ADMIN_PASSWORD=pick_a_dashboard_password
SESSION_SECRET=any_long_random_string
LOOKOGS_API_KEY=leave_blank_for_now_see_step_7
FRONTEND_URL=http://localhost:5173

# Optional — retention job archives to S3 instead of deleting once set.
# Leave unset and the job just logs a warning and skips itself.
RETENTION_DAYS=30
S3_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### 3. Install dependencies
```cmd
cd backend
npm install
cd ../frontend
npm install
cd ..
```
`npm install` in `backend/` automatically runs `prisma generate`
afterward (via `postinstall`).

### 4. Start Postgres, Redis, and pgAdmin
```cmd
docker compose up -d
docker ps
```
Confirm `lookogs_db` shows `Up` / `healthy`.

### 5. Create the database tables
```cmd
cd backend
npx prisma migrate deploy
```

### 6. Start the backend
```cmd
npm run dev
```

### 7. Start the frontend (second terminal)
```cmd
cd frontend
npm run dev
```

### 8. Log in
Use the `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `backend/.env`.

### 9. Create your first App and Source
1. **Applications** → "+ New Application" — a default Source and API
   key are created automatically in the same step; copy the key shown
2. (Optional) **Sources** page to rename it, rotate the key, or add
   additional sources for the same app

### 10. (Optional) enable self-logging

Lookogs can log its own backend traffic using the same client file
any other app would use — see `INTEGRATION.md`. `backend/src/lookogs-client.ts`
is already included in this repo for exactly this purpose; it's wired
into `app.ts` via `initLookogs()` / `attachToFastify()`. Paste your
Source's API key into `backend/.env` as `LOOKOGS_API_KEY` and restart.

### 11. Send a test log
```cmd
curl -X POST http://localhost:3000/api/v1/ingest -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d "{\"logs\": [{\"message\": \"Setup complete\", \"severity\": \"INFO\", \"eventTime\": \"2026-08-13T00:00:00Z\"}]}"
```
Check the **Logs** page, switch to your app.

---

## Daily use
```cmd
docker compose up -d          (if not already running)
cd backend && npm run dev     (terminal 1)
cd frontend && npm run dev    (terminal 2)
```

---

## Contributing / branch workflow

`main` is protected — direct pushes are rejected. For any change:
```cmd
git checkout main
git pull
git checkout -b your-branch-name
# ...make changes, commit...
git push -u origin your-branch-name
```
Then open a Pull Request on GitHub. Every push to that branch updates
the same PR — no need to open a new one until it's merged. Once
merged, start the next piece of work from a fresh branch off `main`.

CI (`.github/workflows/ci.yml`) runs lint + build on both `backend`
and `frontend` for every push and PR — check the **Actions** tab.

---

## Connecting your own app to send logs here

See **`INTEGRATION.md`** — copy the relevant client file (Node/Fastify
or browser) directly into your project. There's no installable package
right now; the client is a small, self-contained file you copy in,
same as `backend/src/lookogs-client.ts` in this repo.

---

## Common problems

**`ERR_MODULE_NOT_FOUND` on `generated/prisma/...`**
Run `npx prisma generate` inside `backend/`.

**`SASL: client password must be a string`**
`backend/.env`'s `DATABASE_URL` doesn't match the root `.env` Postgres
credentials, or `backend/.env` is missing.

**`Can't reach database server`**
Docker isn't running — check `docker ps`, make sure Docker Desktop is open.

**`The table 'public.App' does not exist`**
Run `npx prisma migrate deploy` inside `backend/`.

**Login always fails / 401 loops**
Restart the backend after any `.env` change. Session tokens expire
after 24 hours — log in again if it's been a while.

**CORS error in the browser console**
`FRONTEND_URL` in `backend/.env` must exactly match the URL your
frontend is actually running on.

For more detail, see `SETUP.md`.

---

## Status against the original build plan

**Phases 0–5 (M1–M3): complete.** Full ingestion (JSON, NDJSON,
logfmt, plaintext), filtering/search/advanced query with dot-notation,
severity chart with click-to-zoom, saved views, cursor pagination,
deep links, source management, rate limiting, session-based auth,
retention job, tuned indexes, attribute validation with partial-success
ingestion, CI.

**Known, documented gaps:**
- `Source` has no `format` column in the actual database — ingest
  format is set per-request via the `X-Log-Format` header, not a
  stored per-source default. Not currently blocking anything, since
  the local `lookogs-client.ts` always sends JSON.
- S3 archival code is written but inactive, pending real AWS
  credentials

**Beyond the original plan:**
- A working **Dashboard** page: total logs, error rate %, average
  response time, and a throughput/severity chart
- **Alerting**: query-based triggers that fire webhook notifications
  when a threshold is crossed, with a cooldown to prevent repeat
  notifications — checked every 60 seconds in the background
- A real security hardening pass: rotated leaked keys, closed
  error-detail leaks, timing-safe auth, locked-down CORS, session
  tokens instead of stored passwords, verified rate limiting
- CI (lint + build) on every push/PR

**Phase 6+ (M4) — remaining:**
- Uptime monitoring (nothing pings the app externally)
- Host metrics (CPU/RAM) — different category of data entirely, not
  log-based
- Database query tracing
- Multi-user/roles/SSO (single shared admin login only)
- Actual public deployment — still local-only, pending sandbox setup
