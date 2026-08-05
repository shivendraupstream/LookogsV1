import type { Severity } from "../generated/prisma/enums.js";

export interface ParsedLog {
  message: string;
  severity: Severity;
  eventTime: Date;
  attributes: Record<string, unknown>;
}