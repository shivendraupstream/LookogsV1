import { SourceRepository, LogRepository } from "../repositories/repositories.js";
import { type IngestLog } from "../types/ingest.types.js";
import { validateLog } from "../utils/log-validator.js";
// LogRepository imported from repositories.js
import { Severity } from "../generated/prisma/enums.js";
import {createHash} from "node:crypto";

const sourceRepository = new SourceRepository();

const logRepository = new LogRepository();

export class IngestService {
  async ingest(apiKey: string, logs: IngestLog[]) {

    function hashApiKey(rawKey: string) {
      return createHash("sha256").update(rawKey).digest("hex");
    }
    const source = await sourceRepository.findByApiKeyHash(hashApiKey(apiKey));

    if (!source) {
      throw new Error("Invalid API key");
    }

     for (const log of logs) {
      const errors = validateLog(log);

      if (errors.length > 0) {
        throw new Error(errors.join(" "));
      }
    }

    const parsedLogs = logs.map((log) => ({
        message: log.message,
        severity: log.severity as Severity,
        eventTime: new Date(log.eventTime),
        service: log.service ?? null,
        attributes: log.attributes ?? {},
    }));

    const ingestedCount = await logRepository.createMany({
      appId: source.appId,
      sourceId: source.id,
      logs: parsedLogs,
    });

    return {
      status: "Success",
      ingested: ingestedCount,
    };
  }
}