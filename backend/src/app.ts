import Fastify from "fastify";
import cors from "@fastify/cors";
import { savedViewRoutes } from "./routes/saved-view.routes.js";

import { appRoutes } from "./routes/app.routes.js";
import { sourceRoutes } from "./routes/source.routes.js";
import { ingestRoutes } from "./routes/ingest.routes.js";
import { logRoutes } from "./routes/log.routes.js";
import { errorHandler } from "./plugins/error-handler.js";    
import { initLookogs, attachToFastify } from "./lookogs-client.js";

export const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

initLookogs({ apiKey: "2465f29b150e4a25e69a75c52885f03ce635332d433d157bde39c6da188bff58", serviceName: "lookogs-backend" });
attachToFastify(app);

await app.register(appRoutes, { prefix: "/api/v1" });
await app.register(sourceRoutes, { prefix: "/api/v1" });
await app.register(ingestRoutes);
await app.register(logRoutes);
await app.register(savedViewRoutes, { prefix: "/api/v1" });



await errorHandler(app);

app.get("/health", async () => {
  return {
    status: "healthy",
  };
});