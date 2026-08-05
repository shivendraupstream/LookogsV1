import type { Severity } from "../generated/prisma/enums.js";
import type { ParsedLog } from "../types/log.types.ts";
import type { IngestLog } from "../types/ingest.types.js";

export function mapToParsedLog(log: IngestLog): ParsedLog {
  return {
    message: log.message,
    severity: log.severity as Severity,
    eventTime: new Date(log.eventTime),
    attributes: log.attributes ?? {},
  };
}