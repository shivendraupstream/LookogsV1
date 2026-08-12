import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { parseQuery } from '../utils/query-parser.js';

type Log = NonNullable<Awaited<ReturnType<typeof prisma.log.findFirst>>>;

export type ParsedLog = {
  message: string;
  severity: Log['severity'] | string;
  eventTime: Date;
  service?: string | null;
  attributes: Record<string, unknown>;
};

export interface CreateLogsInput {
  appId: string;
  sourceId: string;
  logs: ParsedLog[];
}

export interface FindLogsQuery {
  appId: string;
  severity?: string;
  sourceId?: string;
  search?: string;
  query?: string;
  startTime?: Date;
  endTime?: Date;
  cursor?: {
    id: string;
    eventTime: Date;
  };
  limit?: number;
}

export class LogRepository {
  private prisma = prisma;

  async createMany(input: CreateLogsInput): Promise<number> {
    const { appId, sourceId, logs } = input;

    const ingestTime = new Date();

    const data = logs.map((log) => ({
      appId,
      sourceId,
      message: log.message,
      severity: log.severity as Log['severity'],
      eventTime: log.eventTime,
      ingestTime,
      service: log.service ?? null,
      attributes: log.attributes as Prisma.InputJsonValue,
    }));

    const result = await this.prisma.log.createMany({
      data,
    });

    return result.count;
  }

  async findManyForHistogram(query: {
    appId: string;
    severity?: string | undefined;
    sourceId?: string | undefined;
    search?: string | undefined;
    startTime: Date;
    endTime: Date;
  }): Promise<{ severity: string; eventTime: Date }[]> {
    const { appId, severity, sourceId, search, startTime, endTime } = query;
    const where: Prisma.LogWhereInput = { appId, eventTime: { gte: startTime, lte: endTime } };
    if (severity) where.severity = severity as Log['severity'];
    if (sourceId) where.sourceId = sourceId;
    if (search) where.message = { contains: search, mode: 'insensitive' };

    return this.prisma.log.findMany({
      where,
      select: { severity: true, eventTime: true },
      orderBy: { eventTime: 'asc' },
    });
  }

  async findMany(query: FindLogsQuery): Promise<Log[]> {
    const { appId, severity, sourceId, search, startTime, endTime, cursor, limit = 50, query: advancedQuery } = query;

    const conditions: Prisma.Sql[] = [Prisma.sql`"appId" = ${appId}`];

    if (severity) {
      conditions.push(Prisma.sql`severity = ${severity}::"Severity"`);
    }
    if (sourceId) {
      conditions.push(Prisma.sql`"sourceId" = ${sourceId}`);
    }
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        Prisma.sql`(message ILIKE ${pattern} OR attributes::text ILIKE ${pattern})`
      );
    }
    if (advancedQuery) {
      const parsed = parseQuery(advancedQuery);
      if (parsed) conditions.push(parsed);
    }
    if (startTime) {
      conditions.push(Prisma.sql`"eventTime" >= ${startTime}`);
    }
    if (endTime) {
      conditions.push(Prisma.sql`"eventTime" <= ${endTime}`);
    }
    if (cursor) {
      conditions.push(
        Prisma.sql`("eventTime" < ${cursor.eventTime} OR ("eventTime" = ${cursor.eventTime} AND id < ${cursor.id}))`
      );
    }

    const whereClause = Prisma.join(conditions, ' AND ');

    const logs = await this.prisma.$queryRaw<Log[]>`
      SELECT id, "appId", "sourceId", severity, message, hostname, service, version,
             "eventTime", "ingestTime", attributes
      FROM logs
      WHERE ${whereClause}
      ORDER BY "eventTime" DESC, id DESC
      LIMIT ${limit}
    `;

    return logs;
  }

  async findById(appId: string, id: string): Promise<Log | null> {
    return this.prisma.log.findFirst({
      where: { id, appId },
    });
  }

  async getAvgResponseTime(appId: string, startTime: Date, endTime: Date): Promise<number | null> {
    const result = await this.prisma.$queryRaw<{ avg: number | null }[]>`
      SELECT AVG((attributes->>'responseTimeMs')::numeric) as avg
      FROM logs
      WHERE "appId" = ${appId}
        AND "eventTime" >= ${startTime}
        AND "eventTime" <= ${endTime}
        AND attributes->>'responseTimeMs' ~ '^[0-9.]+$'
    `;
    return result[0]?.avg ?? null;
  }
}