import type { Log } from "../generated/prisma/client.js";

export interface LogResponseDto {
  id: string;
  severity: string;
  message: string;
  timestamp: Date;
  hostname: string | null;
  service: string | null;
  version: string | null;
  attributes: unknown;
}

export function toLogDto(log: Log): LogResponseDto {
  return {
    id: log.id,
    severity: log.severity,
    message: log.message,
    timestamp: log.eventTime,
    hostname: log.hostname,
    service: log.service,
    version: log.version,
    attributes: log.attributes,
  };
}