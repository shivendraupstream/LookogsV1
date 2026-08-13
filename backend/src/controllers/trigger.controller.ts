import type { FastifyReply, FastifyRequest } from "fastify";
import { TriggerService, type CreateTriggerInput } from "../services/trigger.services.js";

const triggerService = new TriggerService();

export class TriggerController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { appId } = request.params as { appId: string };
    const body = request.body as CreateTriggerInput;

    try {
      const created = await triggerService.create(appId, body);
      return reply.code(201).send(created);
    } catch {
      return reply.code(500).send({ error: "Failed to create trigger" });
    }
  }

  async findAllByApp(request: FastifyRequest, reply: FastifyReply) {
    const { appId } = request.params as { appId: string };
    const triggers = await triggerService.findAllByApp(appId);
    return reply.code(200).send(triggers);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await triggerService.delete(id);
    return reply.code(204).send();
  }
}