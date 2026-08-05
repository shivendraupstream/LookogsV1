# Connecting an App to Lookogs

This guide covers everything a developer needs to send logs from their own
application into Lookogs — no matter what language or framework they use.

## Overview — two steps, always

1. **Create an App and Source in the Lookogs dashboard**, to get an API key.
2. **Add the Lookogs client to your own application** — the recommended way
   is installing it as a package, no manual file copying needed.

There's no way around step 2 — every log has to come from *inside* your
application, since only your code knows when something actually happened.
This is the same model every logging/monitoring tool uses (AppSignal,
Datadog, Sentry, etc.) — you're not doing anything unusual here.

## Step 1 — Get an API key

1. Open the Lookogs dashboard and log in.
2. Go to **Applications** → **+ New Application** → give it a name (usually
   your project's name).
3. Go to **Sources** → pick your new app → **+ New Source** → give it a name
   (e.g. "Backend" or "Frontend") and an environment (e.g. "production").
4. **Copy the API key shown** — it's only displayed once. If you lose it,
   go back to the Sources page and click "Rotate key" to generate a new one.

## Step 2 — Install the client (recommended method)

The client is published as its own package:
**https://github.com/shivendraupstream/lookogs-client**

```bash
npm install github:shivendraupstream/lookogs-client
```

This works for any Node/TypeScript project on any machine — no manual file
copying, and everyone always gets the same, current version.

### Node.js backend (Fastify, Express, or plain scripts)

```ts
import { initLookogs, log } from 'lookogs-client'
import { attachToFastify } from 'lookogs-client/fastify'

initLookogs({
  apiKey: process.env.LOOKOGS_API_KEY!, // never hardcode the real key
  serviceName: 'my-app-backend',
})

// Optional — if using Fastify, this automatically logs every
// request/response with no per-route code needed:
attachToFastify(app)

// Anywhere else in your code, log specific events manually:
log('User signed up', 'INFO', { userId: user.id })
```
*(Not using Fastify? Skip `attachToFastify` — just call `log(...)` at
meaningful points in your routes/middleware instead.)*

### Browser / React / any frontend app

```ts
import { initLookogs, log } from 'lookogs-client/browser'

initLookogs({
  apiKey: 'your-source-api-key', // see security note below
  serviceName: 'my-app-frontend',
})

// This alone captures every uncaught error and unhandled promise
// rejection automatically. For anything else:
log('Checkout completed', 'INFO', { orderId: order.id })
```

⚠️ **Security note for browser apps:** any API key placed in frontend
JavaScript is visible to anyone who opens DevTools. This is fine for
internal tools, but for a public-facing app, only send logs from your
*backend*, or set up a proxy endpoint that adds the real key server-side.

### Any other language (Python, Ruby, Go, PHP, etc.)

There's no client package for other languages yet — call the raw HTTP API
directly instead. See the reference below; it's a single, simple endpoint.

## Alternative: manual file copy (no npm/GitHub access)

If `npm install github:...` isn't available in your environment, you can
copy the client source directly:

1. Get the source from
   `https://github.com/shivendraupstream/lookogs-client`
2. Copy `src/index.ts` (and `src/fastify.ts` or `src/browser.ts`, as
   needed) into your project.
3. Import from the local path instead of the package name, e.g.
   `import { initLookogs } from './lookogs-client/index.js'`.

This works identically, just requires manually re-copying if the client is
ever updated — the package method above avoids that.

## API Reference

**Endpoint:** `POST https://<your-lookogs-url>/api/v1/ingest`

**Headers:**
```
Content-Type: application/json
x-api-key: <your source's API key>
```

**Body:**
```json
{
  "logs": [
    {
      "message": "Something happened",
      "severity": "INFO",
      "eventTime": "2026-08-05T12:00:00.000Z",
      "service": "optional-service-name",
      "attributes": {
        "any": "extra structured data goes here"
      }
    }
  ]
}
```

You can send one log or many in a single request — batching is supported
and recommended for high-volume use, to avoid one HTTP request per log line.

**Valid `severity` values:** `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`

**`eventTime`** must be a valid ISO 8601 timestamp.

**`attributes`** can contain any JSON-serializable data — this is fully
searchable later, including via the advanced query syntax (e.g.
`method:GET`, `status:404`).

**Success response:** `200 OK`
```json
{ "status": "Success", "ingested": 1 }
```

**Test it directly with curl:**
```bash
curl -X POST https://<your-lookogs-url>/api/v1/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY_HERE" \
  -d '{"logs":[{"message":"Test log","severity":"INFO","eventTime":"2026-08-05T12:00:00Z"}]}'
```

## Rate limits

Each source is limited to **300 requests per minute**. This limits the
number of *requests*, not log lines — batch multiple logs into fewer
requests if you're sending high volume.

## Once logs are flowing

Open the Lookogs dashboard, switch to your App in the dropdown on the Logs
page, and you should see your data — filterable by severity, free text,
time range, and the advanced query syntax (`key:value`, `AND`/`OR`).