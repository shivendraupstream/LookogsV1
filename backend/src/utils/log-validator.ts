import type { IngestLog } from "../types/ingest.types.js";

const VALID_SEVERITIES = [
  "TRACE",
  "DEBUG",
  "INFO",
  "WARN",
  "ERROR",
  "FATAL",
] as const;

const MAX_ATTRIBUTE_KEYS = 25;
const ATTRIBUTE_KEY_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function validateLog(log: IngestLog): string[] {
  const errors: string[] = [];

  if (!log.message || log.message.trim().length === 0) {
    errors.push("Message is required.");
  }

  if (!VALID_SEVERITIES.includes(log.severity as any)) {
    errors.push("Invalid severity.");
  }

  if (Number.isNaN(Date.parse(log.eventTime))) {
    errors.push("Invalid eventTime.");
  }

  if (
    log.attributes !== undefined &&
    (typeof log.attributes !== "object" || Array.isArray(log.attributes))
  ) {
    errors.push("Attributes must be an object.");
  } else if (log.attributes) {
    const keys = Object.keys(log.attributes);

    if (keys.length > MAX_ATTRIBUTE_KEYS) {
      errors.push(
        `Attributes must have at most ${MAX_ATTRIBUTE_KEYS} keys (got ${keys.length}).`
      );
    }

    const invalidKeys = keys.filter((key) => !ATTRIBUTE_KEY_PATTERN.test(key));
    if (invalidKeys.length > 0) {
      errors.push(
        `Invalid attribute key(s): ${invalidKeys.join(", ")}. Keys must be alphanumeric and may contain . _ -`
      );
    }
  }

  return errors;
}