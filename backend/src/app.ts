import Fastify from "fastify";
import cors from "@fastify/cors";

import { appRoutes } from "./routes/app.routes.js";
import { sourceRoutes } from "./routes/source.routes.js";
import { ingestRoutes } from "./routes/ingest.routes.js";
import { logRoutes } from "./routes/log.routes.js";
import { errorHandler } from "./plugins/error-handler.js";    

export const app = Fastify({
  logger: true,
});

await app.register(cors);


await app.register(appRoutes, { prefix: "/api/v1" });
await app.register(sourceRoutes, { prefix: "/api/v1" });
await app.register(ingestRoutes, { prefix: "/api/v1" });
await app.register(logRoutes, { prefix: "/api/v1" });



await errorHandler(app);

app.get("/health", async () => {
  return {
    status: "healthy",
  };
});