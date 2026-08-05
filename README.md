# Lookogs

A self-hosted log management platform — logging + basic APM data, built to
replace AppSignal's logging subscription for Upstream Tech.

**Stack:** Node.js, TypeScript, Fastify, Prisma, PostgreSQL, React, Docker

---

## What's in this repo

```
Lookogs/
├── backend/          Fastify API server
├── frontend/         React dashboard
├── docker-compose.yml
├── SETUP.md          Fresh-machine setup, troubleshooting
├── INTEGRATION.md    How to connect YOUR OWN app to send logs here
└── README.md         This file — exact run instructions
```

If you're setting this up on a brand new machine for the first time, read
this file first, then `SETUP.md` if anything goes wrong.

---

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- **Docker Desktop** — must be open and running before you start Postgres
- **Git**

---

## First-time setup (do this once per machine)

### 1. Clone the repo

```cmd
git clone https://github.com/shivendraupstream/Lookogs.git
cd Lookogs
```

### 2. Create environment files

Two `.env` files are needed — neither is committed to Git (they contain
secrets), so you create them fresh on every machine.

**Root `.env`** (same folder as `docker-compose.yml`):
```cmd
copy .env.example .env
```
Open it and set your own values — any values work, they just need to match
step 3 below:
```
POSTGRES_USER=your_chosen_username
POSTGRES_PASSWORD=your_chosen_password
POSTGRES_DB=lookogs_logs
REDIS_PORT=6379
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=changeme
```

**`backend/.env`:**
```cmd
cd backend
copy .env.example .env
```
Fill in:
```
DATABASE_URL="postgresql://your_chosen_username:your_chosen_password@localhost:5433/lookogs_logs"
ADMIN_USERNAME=pick_a_dashboard_username
ADMIN_PASSWORD=pick_a_dashboard_password
SESSION_SECRET=any_long_random_string
LOOKOGS_API_KEY=leave_blank_for_now_see_step_7
FRONTEND_URL=http://localhost:5173
```
The `DATABASE_URL` username/password/port must exactly match the root
`.env` values and the port Postgres is mapped to (`5433`, per
`docker-compose.yml`).

### 3. Install dependencies

```cmd
cd backend
npm install
cd ../frontend
npm install
cd ..
```
`npm install` in `backend/` automatically runs `prisma generate` afterward
(via the `postinstall` script) — this creates the Prisma client code your
app needs. No separate step required.

### 4. Start Postgres, Redis, and pgAdmin

From the repo root:
```cmd
docker compose up -d
docker ps
```
Confirm `lookogs_db` shows as `Up` / `healthy` before continuing.

### 5. Create the database tables

```cmd
cd backend
npx prisma migrate deploy
```

### 6. Start the backend

```cmd
npm run dev
```
Leave this terminal running. You should see `Server listening at
http://127.0.0.1:3000`.

### 7. Start the frontend (in a **second** terminal)

```cmd
cd frontend
npm run dev
```
Leave this running too. Open the URL it prints (usually
`http://localhost:5173`).

### 8. Log in

You'll see a login screen — use the `ADMIN_USERNAME`/`ADMIN_PASSWORD` you
set in `backend/.env` (step 2).

### 9. Create your first App and Source

1. **Applications** page → "+ New Application"
2. **Sources** page → pick your app → "+ New Source" → **copy the API key
   shown — it's only displayed once**

### 10. (Optional) enable self-logging

If you want Lookogs to log its own backend traffic:
1. Install the client package: `cd backend && npm install github:shivendraupstream/lookogs-client`
2. In `app.ts`, import from the package instead of a local file:
   ```ts
   import { initLookogs } from "lookogs-client";
   import { attachToFastify } from "lookogs-client/fastify";
   ```
3. Paste the API key from step 9 into `backend/.env` as `LOOKOGS_API_KEY`
4. Restart the backend (`Ctrl+C`, then `npm run dev` again)

### 11. Send a test log

```cmd
curl -X POST http://localhost:3000/api/v1/ingest -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY_FROM_STEP_9" -d "{\"logs\": [{\"message\": \"Setup complete\", \"severity\": \"INFO\", \"eventTime\": \"2026-08-05T00:00:00Z\"}]}"
```
Then check the **Logs** page in the dashboard, switch to your app in the
dropdown — you should see it.

---

## Daily use (after first-time setup is done)

You don't repeat all of the above every time — just:

```cmd
docker compose up -d          (if Docker isn't already running)
cd backend && npm run dev     (terminal 1)
cd frontend && npm run dev    (terminal 2)
```

---

## Connecting your own app to send logs here

See **`INTEGRATION.md`** — covers Node/backend apps, browser/frontend apps,
and the raw HTTP API for any other language.

The client is published as its own package — no manual file copying:
**https://github.com/shivendraupstream/lookogs-client**
```
npm install github:shivendraupstream/lookogs-client
```

---

## Common problems

**`ERR_MODULE_NOT_FOUND` on `generated/prisma/...`**
Run `npx prisma generate` inside `backend/`.

**`SASL: client password must be a string`**
`backend/.env`'s `DATABASE_URL` doesn't match the root `.env` Postgres
credentials, or `backend/.env` is missing.

**`Can't reach database server`**
Docker isn't running, or the Postgres container didn't start. Check
`docker ps`, and make sure Docker Desktop itself is open.

**`The table 'public.App' does not exist`**
Migrations were never run — `npx prisma migrate deploy` inside `backend/`.

**Login always fails with 401**
Restart the backend after any `.env` change — it only reads `.env` once,
at startup.

**CORS error in the browser console**
`FRONTEND_URL` in `backend/.env` must exactly match the URL your frontend
is actually running on.

For more detail on any of these, see `SETUP.md`.

---

## Roadmap / what's built so far

- ✅ App/Source management, API key auth, rate limiting
- ✅ Log ingestion (JSON only — NDJSON/logfmt/plaintext not yet supported)
- ✅ Filtering, free-text + JSON-attribute search, advanced query syntax
  (`severity:error AND method:GET`)
- ✅ Severity-over-time chart, saved views, cursor pagination
- ✅ Session-token dashboard login
- ❌ Not yet: retention/cleanup job, deep links to a single log line,
  uptime/host metrics, alerting