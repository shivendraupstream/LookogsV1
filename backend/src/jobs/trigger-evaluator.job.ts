import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { parseQuery } from "../utils/query-parser.js";

const CHECK_INTERVAL_MS = 60 * 1000; // evaluate all triggers once a minute

async function countMatches(appId: string, query: string, windowMinutes: number): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const parsed = parseQuery(query);

  const conditions: Prisma.Sql[] = [
    Prisma.sql`"appId" = ${appId}`,
    Prisma.sql`"eventTime" >= ${since}`,
  ];
  if (parsed) conditions.push(parsed);

  const whereClause = Prisma.join(conditions, ' AND ');

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM logs WHERE ${whereClause}
  `;

  return Number(result[0]?.count ?? 0);
}

async function sendWebhook(webhookUrl: string, payload: Record<string, unknown>) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to send trigger webhook:", err);
  }
}

async function evaluateTriggers(app: FastifyInstance) {
  const triggers = await prisma.trigger.findMany();

  for (const trigger of triggers) {
    try {
      const matchCount = await countMatches(trigger.appId, trigger.query, trigger.windowMinutes);

      if (matchCount < trigger.thresholdCount) continue;

      const cooldownMs = trigger.cooldownMinutes * 60 * 1000;
      const cooledDown =
        !trigger.lastNotifiedAt || Date.now() - trigger.lastNotifiedAt.getTime() >= cooldownMs;

      if (!cooledDown) continue;

      await sendWebhook(trigger.webhookUrl, {
        triggerName: trigger.name,
        appId: trigger.appId,
        query: trigger.query,
        matchCount,
        threshold: trigger.thresholdCount,
        windowMinutes: trigger.windowMinutes,
        firedAt: new Date().toISOString(),
      });

      await prisma.trigger.update({
        where: { id: trigger.id },
        data: { lastNotifiedAt: new Date() },
      });

      app.log.info(`Trigger "${trigger.name}" fired: ${matchCount} matches (threshold ${trigger.thresholdCount})`);
    } catch (err) {
      app.log.error({ err }, `Failed to evaluate trigger ${trigger.id}`);
    }
  }
}

export function startTriggerEvaluator(app: FastifyInstance) {
  setInterval(() => evaluateTriggers(app), CHECK_INTERVAL_MS);
  app.log.info("Trigger evaluator started (checking every 60s)");
}