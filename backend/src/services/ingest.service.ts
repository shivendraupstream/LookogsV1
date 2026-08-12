import { SourceRepository, LogRepository } from "../repositories/repositories.js";
import { type IngestLog } from "../types/ingest.types.js";
import { validateLog } from "../utils/log-validator.js";
import { Severity } from "../generated/prisma/enums.js";
import { createHash } from "node:crypto";
import { parseNdjson, parseLogfmt, parsePlaintext } from "../utils/log-parsers.js";

const sourceRepository = new SourceRepository();
const logRepository = new LogRepository();

const MAX_MESSAGE_LENGTH = 10000;

function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

type IngestInput = { logs: IngestLog[] } | { raw: string; format?: string | undefined };

export class IngestService {
  async ingest(apiKey: string, input: IngestInput) {
    const source = await sourceRepository.findByApiKeyHash(hashApiKey(apiKey));

    if (!source) {
      throw new Error("Invalid API key");
    }

    let logs: IngestLog[];

    if ("logs" in input) {
      logs = input.logs;
    } else {
      const format = (input.format || "plaintext").toLowerCase();
      if (format === "ndjson") logs = parseNdjson(input.raw);
      else if (format === "logfmt") logs = parseLogfmt(input.raw);
      else logs = parsePlaintext(input.raw);
    }

    const validLogs: IngestLog[] = [];
    const rejected: { index: number; errors: string[] }[] = [];

    logs.forEach((log, index) => {
      const errors = validateLog(log);
      if (errors.length > 0) {
        rejected.push({ index, errors });
      } else {
        validLogs.push(log);
      }
    });

    const parsedLogs = validLogs.map((log) => ({
      message:
        log.message.length > MAX_MESSAGE_LENGTH
          ? log.message.slice(0, MAX_MESSAGE_LENGTH) + "... [truncated]"
          : log.message,
      severity: log.severity as Severity,
      eventTime: new Date(log.eventTime),
      service: log.service ?? null,
      attributes: log.attributes ?? {},
    }));

    const ingestedCount =
      parsedLogs.length > 0
        ? await logRepository.createMany({
            appId: source.appId,
            sourceId: source.id,
            logs: parsedLogs,
          })
        : 0;

    return {
      status: rejected.length === 0 ? "Success" : "Partial Success",
      ingested: ingestedCount,
      rejected: rejected.length,
      errors: rejected,
    };
  }
}