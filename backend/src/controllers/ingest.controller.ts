import { type FastifyReply, type FastifyRequest } from "fastify";
import { IngestService } from "../services/ingest.service.js";
import { type IngestRequest } from "../types/ingest.types.js";

const ingestService = new IngestService();

export class IngestController {
  async ingest(request: FastifyRequest, reply: FastifyReply) {
    const apiKey = request.headers["x-api-key"];

    if (typeof apiKey !== "string") {
      return reply.code(400).send({ error: "Missing X-API-Key header" });
    }

    const contentType = request.headers["content-type"] || "";

    try {
      let result;

      if (contentType.includes("application/json")) {
        const { logs } = request.body as IngestRequest;
        result = await ingestService.ingest(apiKey, { logs });
      } else {
        const raw = request.body as string;
        const formatHeader = request.headers["x-log-format"] as string | undefined;
        result = await ingestService.ingest(apiKey, { raw, format: formatHeader });
      }

      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      }
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }
}