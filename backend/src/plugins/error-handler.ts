import { type FastifyInstance } from "fastify";

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: unknown, request, reply) => {
    // Log the full error server-side, for debugging
    request.log.error(error);

    // Never send internal error details to the client — just a generic message
    return reply.status(500).send({
      error: "Internal Server Error",
    });
  });
}