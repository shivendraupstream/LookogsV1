import { type FastifyReply, type FastifyRequest } from "fastify";
import { LogService } from "../services/log.service.js";
import type { FindLogsQuery } from "../repositories/log.repositories.js";
import { Severity } from "../generated/prisma/enums.js";

const logService = new LogService();

export class LogController {
    async getLogbyId(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const { id } = request.params as {
            id: string;
        };

        const { appId } = request.query as {
            appId?: string;
        };

        if (!appId) {
            return reply.code(400).send({
            error: "appId is required",
            });
        }

        try {
            const log = await logService.getLogbyId(appId, id);

            if (!log) {
            return reply.code(404).send({
                error: "Log not found",
            });
            }

            return reply.code(200).send(log);

        } catch (error) {
            return reply.code(500).send({
            error: "Failed to retrieve log",
            });
        }
    };

    async getHistogram(request: FastifyRequest, reply: FastifyReply) {
        const { appId, severity, sourceId, search, startTime, endTime } = request.query as {
        appId?: string; severity?: Severity; sourceId?: string; search?: string; startTime?: string; endTime?: string;
        };

        if (!appId) return reply.code(400).send({ error: "appId is required" });
        if (!startTime || !endTime) return reply.code(400).send({ error: "startTime and endTime are required" });
        if (Number.isNaN(new Date(startTime).getTime()) || Number.isNaN(new Date(endTime).getTime())) {
        return reply.code(400).send({ error: "Invalid startTime or endTime" });
        }
        if (severity && !Object.values(Severity).includes(severity)) {
        return reply.code(400).send({ error: "Invalid severity value" });
        }

        try {
        const buckets = await logService.getHistogram({
            appId, severity, sourceId, search,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        });
        return reply.code(200).send({ buckets });
        } catch (error) {
        return reply.code(500).send({ error: "Failed to retrieve histogram" });
        }
    }

  async getLogs(
    request: FastifyRequest,
    reply: FastifyReply
  ) {

    const { 
        appId,
        severity,
        sourceId,   
        search,
        startTime,
        endTime, 
        limit,
        cursorId,
        cursorTime,
     } = request.query as {
      appId?: string;
      severity?: Severity;
      sourceId?: string;
      search?: string;
      startTime?: string;
      endTime?: string;
      limit?: number;
      cursorId?: string;
      cursorTime?: string;
    };

    if (
        severity && !Object.values(Severity).includes(severity)
    ){
        return reply.code(400).send({
            error: "Invalid severity value",
        });
    }

    if (!appId) {
      return reply.code(400).send({
        error: "appId is required",
      });
    }

    if (limit) {
        const parsedLimit = Number(limit);

        if (Number.isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            return reply.code(400).send({
            error: "limit must be between 1 and 100",
            });
        }
    }

    if (startTime && Number.isNaN(new Date(startTime).getTime())) {
        return reply.code(400).send({
            error: "Invalid startTime",
        });
        }

        if (endTime && Number.isNaN(new Date(endTime).getTime())) {
        return reply.code(400).send({
            error: "Invalid endTime",
        });
    }

    const query: FindLogsQuery = {
        appId,
        };

        if (severity) {
            query.severity = severity;
            }

        if (sourceId) {
            query.sourceId = sourceId;
            }

        if (search) {
            query.search = search;
            }

        if (startTime) {
            query.startTime = new Date(startTime);
            }

        if (endTime) {
            query.endTime = new Date(endTime);
            }

        if (limit) {
            query.limit = Number(limit);
        }
        if (cursorId && cursorTime) {
            query.cursor = {
            id: cursorId,
            eventTime: new Date(cursorTime),
        };
    }

    

    try {
      const logs = await logService.getLogs(query);

      const lastLog = logs.at(-1);

      const nextCursor = lastLog
        ? {
            id: lastLog.id,
            eventTime: lastLog.timestamp,
            }
        : null;

      return reply.code(200).send({logs, nextCursor});
    } catch (error) {
      return reply.code(500).send({
        error: "Failed to retrieve logs",
      });
    }
  }
}