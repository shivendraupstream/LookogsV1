import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

const parsedRetentionDays = Number(process.env.RETENTION_DAYS);
const RETENTION_DAYS = Number.isNaN(parsedRetentionDays) ? 30 : parsedRetentionDays;

//  need to set up a push to s3 bucket after 30 days. 


const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // run once a day

export async function purgeOldLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.log.deleteMany({
    where: { eventTime: { lt: cutoff } },
  });

  return result.count;
}

export function startRetentionJob(app: FastifyInstance) {
  const runPurge = async () => {
    try {
      const deleted = await purgeOldLogs();
      app.log.info(`Retention purge: deleted ${deleted} logs older than ${RETENTION_DAYS} days`);
    } catch (err) {
      app.log.error({ err }, "Retention purge failed");
    }
  };

  runPurge(); // run once immediately on startup
  setInterval(runPurge, CHECK_INTERVAL_MS);
}