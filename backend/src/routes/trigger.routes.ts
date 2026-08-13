import type { FastifyInstance } from "fastify";
import { TriggerController } from "../controllers/trigger.controller.js";

export async function triggerRoutes(fastify: FastifyInstance) {
  const triggerController = new TriggerController();

  fastify.post<{ Params: { appId: string } }>(
    "/apps/:appId/triggers",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: { appId: { type: "string", minLength: 1 } },
        },
        body: {
          type: "object",
          required: ["name", "query", "thresholdCount", "webhookUrl"],
          properties: {
            name: { type: "string", minLength: 1 },
            query: { type: "string", minLength: 1 },
            thresholdCount: { type: "integer", minimum: 1 },
            windowMinutes: { type: "integer", minimum: 1 },
            webhookUrl: { type: "string", minLength: 1 },
            cooldownMinutes: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    triggerController.create.bind(triggerController)
  );

  fastify.get<{ Params: { appId: string } }>(
    "/apps/:appId/triggers",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: { appId: { type: "string", minLength: 1 } },
        },
      },
    },
    triggerController.findAllByApp.bind(triggerController)
  );

  fastify.delete<{ Params: { id: string } }>(
    "/triggers/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1 } },
        },
      },
    },
    triggerController.delete.bind(triggerController)
  );
}