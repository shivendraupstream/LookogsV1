import type { IngestLog } from "../types/ingest.types.js";

const VALID_SEVERITIES = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

function normalizeSeverity(raw: string | undefined): string {
  if (!raw) return "INFO";
  const upper = raw.toUpperCase();
  const aliasMap: Record<string, string> = {
    WARNING: "WARN",
    ERR: "ERROR",
    CRITICAL: "FATAL",
    CRIT: "FATAL",
  };
  const normalized = aliasMap[upper] || upper;
  return VALID_SEVERITIES.includes(normalized) ? normalized : "INFO";
}

function mapFieldsToIngestLog(fields: Record<string, unknown>): IngestLog {
  const message = String(fields.message ?? fields.msg ?? fields.text ?? JSON.stringify(fields));
  const severity = normalizeSeverity((fields.severity ?? fields.level) as string | undefined);

  const eventTimeRaw = (fields.eventTime ?? fields.timestamp ?? fields.time) as string | undefined;
  const eventTime =
    eventTimeRaw && !Number.isNaN(Date.parse(eventTimeRaw))
      ? eventTimeRaw
      : new Date().toISOString();

  const service = fields.service as string | undefined;

  const knownKeys = new Set([
    "message", "msg", "text", "severity", "level",
    "eventTime", "timestamp", "time", "service", "attributes",
  ]);

  const attributes: Record<string, unknown> =
    typeof fields.attributes === "object" && fields.attributes !== null
      ? (fields.attributes as Record<string, unknown>)
      : {};

  for (const [key, value] of Object.entries(fields)) {
    if (!knownKeys.has(key)) attributes[key] = value;
  }

  return { message, severity, eventTime, service, attributes };
}

function fallbackToPlaintextLine(line: string): IngestLog {
  return { message: line, severity: "INFO", eventTime: new Date().toISOString(), attributes: {} };
}

export function parseNdjson(raw: string): IngestLog[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return mapFieldsToIngestLog(JSON.parse(line));
      } catch {
        // Malformed JSON on this one line — don't fail the whole batch,
        // just capture it as a plain message instead
        return fallbackToPlaintextLine(line);
      }
    });
}

function parseLogfmtLine(line: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /([a-zA-Z0-9_.-]+)=("(?:[^"\\]|\\.)*"|\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    const key = match[1];
    let value = match[2];

    if (key === undefined || value === undefined) continue;

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    result[key] = value;
  }
  return result;
}

export function parseLogfmt(raw: string): IngestLog[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const fields = parseLogfmtLine(line);
      return Object.keys(fields).length === 0
        ? fallbackToPlaintextLine(line)
        : mapFieldsToIngestLog(fields);
    });
}

export function parsePlaintext(raw: string): IngestLog[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(fallbackToPlaintextLine);
}