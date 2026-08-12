import type { FastifyInstance } from "fastify";
import { AppService } from "../services/app.service.js";
import { SourceService } from "../services/source.service.js";

export async function sourceRoutes(fastify: FastifyInstance) {
  const appService = new AppService();
  const sourceService = new SourceService();


  fastify.post<{ Params: { id: string } }>(
    "/sources/:id/rotate-key",
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
      const found = await sourceService.findById(id);
      if (!found) {
        reply.code(404).send({ error: "Source not found" });
        return;
      }
      const rotated = await sourceService.rotateKey(id);
      reply.code(200).send(rotated);
    }
  );

  fastify.patch<{ Params: { id: string }; Body: { name?: string; environment?: string } }>(
    "/sources/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", minLength: 1 } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            environment: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, environment } = request.body;

      const found = await sourceService.findById(id);
      if (!found) {
        reply.code(404).send({ error: "Source not found" });
        return;
      }

      const updated = await sourceService.update(id, name, environment);
      reply.code(200).send(updated);
    }
  );
  
  fastify.post<{
    Params: { appId: string };
    Body: { name: string; environment: string };
  }>(
    "/apps/:appId/sources",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: {
            appId: { type: "string", minLength: 1 },
          },
        },
        body: {
          type: "object",
          required: ["name", "environment"],
          additionalProperties: false,
          properties: {
            name: { type: "string", minLength: 1 },
            environment: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { appId } = request.params;
      const { name, environment } = request.body;

      const app = await appService.findById(appId);
      if (!app) {
        reply.code(404).send({ error: "App not found" });
        return;
      }

      const created = await sourceService.create(appId, name, environment);
      reply.code(201).send(created);
    }
  );

  fastify.get<{ Params: { appId: string } }>(
    "/apps/:appId/sources",
    {
      schema: {
        params: {
          type: "object",
          required: ["appId"],
          properties: {
            appId: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request) => {
      const { appId } = request.params;
      return sourceService.findAllByApp(appId);
    }
  );

  fastify.get<{ Params: { id: string } }>(
    "/sources/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const found = await sourceService.findById(id);
      if (!found) {
        reply.code(404).send({ error: "Source not found" });
        return;
      }
      return found;
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/sources/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      await sourceService.delete(id);
      reply.code(204).send();
    }
  );
}
