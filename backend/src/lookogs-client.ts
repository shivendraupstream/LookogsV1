// lookogs-client.ts — server-side (Fastify) version, local copy
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
    // Avoid an infinite loop — don't log requests to the ingest endpoint itself
    if (request.url.includes('/ingest')) return

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