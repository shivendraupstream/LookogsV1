# React + TypeScript + Vite

# Lookogs — Fresh Machine Setup

This guide gets Lookogs running on a brand new machine from a clean `git clone`.

## Why this is needed

A few files are intentionally **not** committed to Git (they're in `.gitignore`), because they either contain secrets or are auto-generated build output:

- `.env` (root) — Postgres/Redis/pgAdmin credentials for Docker Compose
- `backend/.env` — the database connection string for the app itself
- `backend/src/generated/prisma/` — Prisma's generated client code

None of these exist right after cloning. This guide recreates them.

## Important: the database credentials are NOT secrets to find

`POSTGRES_USER` / `POSTGRES_PASSWORD` are not tied to any external account or
service — Docker Compose uses them to create a **brand new, empty** Postgres
database from scratch, right there on your machine. You are not looking up a
"correct" password anywhere; you're inventing one on the spot.

The only rule: whatever username/password you choose in the root `.env` file
(which configures the actual Postgres container) must **exactly match** what's
in `backend/.env`'s `DATABASE_URL` (which tells the app how to log in to that
same container). As long as those two files agree with each other, any values
work.

## Setup steps

1. Clone the repo:
   ```
   git clone https://github.com/shivendraupstream/Lookogs.git
   cd Lookogs
   ```

2. Create the root `.env` file (same folder as `docker-compose.yml`):
   ```
   copy .env.example .env
   ```
   Open it and set your own values for `POSTGRES_USER` / `POSTGRES_PASSWORD` —
   any values are fine, they just need to match step 3.

3. Create the backend `.env` file:
   ```
   cd backend
   copy .env.example .env
   ```
   Update `DATABASE_URL` so the username/password/db name **match exactly**
   what you set in the root `.env` in step 2, and the port matches what's
   mapped in `docker-compose.yml` (currently `5433` on the host).

4. Install dependencies (this also auto-runs `prisma generate` via the
   `postinstall` script):
   ```
   npm install
   cd ../frontend
   npm install
   cd ..
   ```

5. Start Postgres/Redis/pgAdmin:
   ```
   docker compose up -d
   docker ps
   ```
   Confirm `lookogs_db` shows as `Up` / `healthy` before continuing.

6. Create the database tables:
   ```
   cd backend
   npx prisma migrate deploy
   ```

7. Run both servers (two separate terminals):
   ```
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   cd frontend
   npm run dev
   ```

8. Open the frontend URL shown in Terminal 2's output (usually
   `http://localhost:5173`). You'll start with an empty database — create a
   fresh App and Source through the UI to begin testing.

## If something goes wrong

- **`ERR_MODULE_NOT_FOUND` on `generated/prisma/...`** — the Prisma client
  wasn't generated. Run `npx prisma generate` manually inside `backend/`.
- **`SASL: client password must be a string`** — your `backend/.env`
  `DATABASE_URL` doesn't match the root `.env` Postgres credentials, or
  `backend/.env` is missing entirely.
- **`Can't reach database server`** — Docker isn't running, or the Postgres
  container didn't start. Check `docker ps` and make sure Docker Desktop
  itself is open.
- **`The table 'public.App' does not exist`** — migrations were never run.
  Run `npx prisma migrate deploy` inside `backend/`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
