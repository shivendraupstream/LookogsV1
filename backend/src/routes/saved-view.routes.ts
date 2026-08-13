import type { FastifyInstance } from "fastify";
import { SavedViewService } from "../services/saved-view.service.js";
import type { Prisma } from "../generated/prisma/client.js";


export async function savedViewRoutes(fastify: FastifyInstance) {
  const savedViewService = new SavedViewService();

  fastify.post<{ Params: { appId: string }; Body: { name: string; filters: Prisma.InputJsonValue } }>(
    "/apps/:appId/views",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: { appId: { type: "string", minLength: 1 } },
        },
        body: {
          type: "object",
          required: ["name", "filters"],
          properties: {
            name: { type: "string", minLength: 1 },
            filters: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const { appId } = request.params;
      const { name, filters } = request.body;
      const created = await savedViewService.create(appId, name, filters);
      reply.code(201).send(created);
    }
  );

  fastify.get<{ Params: { appId: string } }>(
    "/apps/:appId/views",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: { appId: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request) => {
      const { appId } = request.params;
      return savedViewService.findAllByApp(appId);
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/views/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await savedViewService.delete(id);
      reply.code(204).send();
    }
  );
}