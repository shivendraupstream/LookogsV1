# Connecting an App to Lookogs

This guide covers everything a developer needs to send logs from their
own application into Lookogs — no matter what language or framework
they use.

## Overview — two steps, always

1. **Create an App and Source in the Lookogs dashboard**, to get an API key.
2. **Copy the relevant client file into your own application.**

There's no way around step 2 — every log has to come from *inside*
your application, since only your code knows when something actually
happened. This is the same model every logging/monitoring tool uses
(AppSignal, Datadog, Sentry, etc.) — you're not doing anything unusual
here.

*(Note: there is currently no installable npm package for this client
— it's a small, self-contained file you copy directly into your
project. `backend/src/lookogs-client.ts` in this repo is exactly this
file, used for Lookogs' own self-logging.)*

## Step 1 — Get an API key

1. Open the Lookogs dashboard and log in.
2. Go to **Applications** → **+ New Application** → give it a name. A
   default Source and API key are created automatically in the same step.
3. **Copy the API key shown** — it's only displayed once. If you lose
   it, go to the Sources page and click "Rotate key" to generate a new one.

## Step 2 — Copy in the client

### Node.js backend (Fastify, Express, or plain scripts)

Create `lookogs-client.ts` in your project with this content:

```ts
import type { FastifyInstance } from 'fastify'

interface LookogsConfig {
  apiKey: string
  baseUrl?: string
  serviceName?: string
}

let config: LookogsConfig | null = null

export function initLookogs(cfg: LookogsConfig) {
  config = {
    baseUrl: 'http://localhost:3000/api/v1/ingest',
    ...cfg,
  }
}

type Severity = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

export async function log(
  message: string,
  severity: Severity = 'INFO',
  attributes: Record<string, unknown> = {}
) {
  if (!config) {
    console.warn('Lookogs client not initialized — call initLookogs() first')
    return
  }

  try {
    await fetch(config.baseUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey },
      body: JSON.stringify({
        logs: [
          {
            message,
            severity,
            eventTime: new Date().toISOString(),
            service: config.serviceName,
            attributes,
          },
        ],
      }),
    })
  } catch (err) {
    console.error('Failed to send log to Lookogs:', err)
  }
}

export function attachToFastify(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    if (request.url.includes('/ingest')) return // avoid a self-logging loop

    const severity: Severity =
      reply.statusCode >= 500 ? 'ERROR' : reply.statusCode >= 400 ? 'WARN' : 'INFO'

    await log(`${request.method} ${request.url} → ${reply.statusCode}`, severity, {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: reply.elapsedTime,
    })
  })
}
```

Then, in your app's startup code:
```ts
import { initLookogs, log } from './lookogs-client'
import { attachToFastify } from './lookogs-client' // if using Fastify

initLookogs({
  apiKey: process.env.LOOKOGS_API_KEY!, // never hardcode the real key
  baseUrl: 'http://localhost:3000/api/v1/ingest', // real URL once deployed
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

Create `src/lib/lookogs-client.ts` with this content:

```ts
interface LookogsConfig {
  apiKey: string
  baseUrl?: string
  serviceName?: string
}

let config: LookogsConfig | null = null

type Severity = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

export function initLookogs(cfg: LookogsConfig) {
  config = {
    baseUrl: 'http://localhost:3000/api/v1/ingest',
    ...cfg,
  }

  window.addEventListener('error', (event) => {
    log(event.message, 'ERROR', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    log('Unhandled promise rejection', 'ERROR', {
      reason: String(event.reason),
    })
  })
}

export async function log(
  message: string,
  severity: Severity = 'INFO',
  attributes: Record<string, unknown> = {}
) {
  if (!config) {
    console.warn('Lookogs client not initialized — call initLookogs() first')
    return
  }

  try {
    await fetch(config.baseUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey },
      body: JSON.stringify({
        logs: [
          {
            message,
            severity,
            eventTime: new Date().toISOString(),
            service: config.serviceName,
            attributes,
          },
        ],
      }),
    })
  } catch (err) {
    console.error('Failed to send log to Lookogs:', err)
  }
}
```

Then, as early as possible in your app's entry point:
```ts
import { initLookogs, log } from './lib/lookogs-client'

initLookogs({
  apiKey: 'your-source-api-key', // see security note below
  baseUrl: 'http://localhost:3000/api/v1/ingest', // real URL once deployed
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

No client file exists for other languages — call the raw HTTP API
directly instead. See the reference below; it's a single, simple endpoint.

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
      "eventTime": "2026-08-13T12:00:00.000Z",
      "service": "optional-service-name",
      "attributes": {
        "any": "extra structured data goes here"
      }
    }
  ]
}
```

You can send one log or many in a single request — batching is
supported and recommended for high-volume use.

**Valid `severity` values:** `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`

**`eventTime`** must be a valid ISO 8601 timestamp.

**`attributes`** can contain any JSON-serializable data — this is fully
searchable later, including via the advanced query syntax (e.g.
`method:GET`, `status:404`, or `user.id:42` for nested objects).

**Non-JSON formats:** NDJSON, logfmt, and plaintext are also supported
— send the raw text body with `Content-Type: text/plain` and an
`X-Log-Format` header set to `ndjson`, `logfmt`, or `plaintext`.

**Success response:** `200 OK`
```json
{ "status": "Success", "ingested": 1, "rejected": 0, "errors": [] }
```
If some logs in a batch are invalid, you'll get `"status": "Partial Success"`
with the valid ones still ingested and the invalid ones listed in `errors`.

**Test it directly with curl:**
```bash
curl -X POST https://<your-lookogs-url>/api/v1/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY_HERE" \
  -d '{"logs":[{"message":"Test log","severity":"INFO","eventTime":"2026-08-13T12:00:00Z"}]}'
```

## Rate limits

Each source is limited to **300 requests per minute**. This limits the
number of *requests*, not log lines — batch multiple logs into fewer
requests if you're sending high volume.

## Alerts

Once logs are flowing, you can set up an **Alert** (Alerts page in the
dashboard) — a saved query that checks itself every 60 seconds and
fires a webhook (Slack, Discord, or any URL) when a threshold is
crossed, with a cooldown to prevent repeat notifications.

## Once logs are flowing

Open the Lookogs dashboard, switch to your App in the dropdown on the
Logs page, and you should see your data — filterable by severity, free
text, time range, and the advanced query syntax.