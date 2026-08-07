import Fastify from "fastify";
import cors from "@fastify/cors";
import { timingSafeEqual } from "node:crypto";
import { savedViewRoutes } from "./routes/saved-view.routes.js";

import { appRoutes } from "./routes/app.routes.js";
import { sourceRoutes } from "./routes/source.routes.js";
import { ingestRoutes } from "./routes/ingest.routes.js";
import { logRoutes } from "./routes/log.routes.js";
import { errorHandler } from "./plugins/error-handler.js";
import { initLookogs } from "lookogs-client";
import { attachToFastify } from "lookogs-client/fastify";
import { createSessionToken, verifySessionToken } from "./utils/session-token.js";
import rateLimit from "@fastify/rate-limit";

import { startRetentionJob } from "./jobs/retention.job.js";
import { purgeOldLogs } from "./jobs/retention.job.js";

export const app = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024, // 10MB — default 1MB is too small for large log batches
});

await app.register(rateLimit, {
  max: 300,
  timeWindow: "1 minute",
  keyGenerator: (request) => {
    const apiKey = request.headers["x-api-key"];
    if (typeof apiKey === "string") return apiKey; // rate limit per source API key
    return request.ip; // fall back to IP for non-ingest routes
  },
});

await app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in the environment");
}

// Public login endpoint — exchanges username/password for a short-lived session token.
app.post("/api/v1/login", async (request, reply) => {
  const { username = "", password = "" } = (request.body as { username?: string; password?: string }) ?? {};

  const usernameMatches =
    username.length === ADMIN_USERNAME.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(ADMIN_USERNAME));

  const passwordMatches =
    password.length === ADMIN_PASSWORD.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD));

  if (!usernameMatches || !passwordMatches) {
    return reply.code(401).send({ error: "Invalid credentials" });
  }

  const token = createSessionToken();
  return reply.code(200).send({ token });
});

app.addHook("onRequest", async (request, reply) => {
  if (request.url === "/health") return;
  if (request.method === "OPTIONS") return;
  if (request.url === "/api/v1/login") return;
  if (request.url === "/api/v1/ingest") return; // has its own per-source API key auth

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Authentication required" });
    return reply;
  }

  const token = authHeader.slice("Bearer ".length);

  if (!verifySessionToken(token)) {
    reply.code(401).send({ error: "Invalid or expired session" });
    return reply;
  }
});

initLookogs({ apiKey: process.env.LOOKOGS_API_KEY!, serviceName: "lookogs-backend" });
attachToFastify(app);
startRetentionJob(app);

await app.register(appRoutes, { prefix: "/api/v1" });
await app.register(sourceRoutes, { prefix: "/api/v1" });
await app.register(ingestRoutes);
await app.register(logRoutes);
await app.register(savedViewRoutes, { prefix: "/api/v1" });

await errorHandler(app);

app.post("/api/v1/admin/purge-logs", async (request, reply) => {
  const deleted = await purgeOldLogs();
  return reply.code(200).send({ deleted });
});

app.get("/health", async () => {
  return {
    status: "healthy",
  };
});