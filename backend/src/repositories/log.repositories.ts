import { prisma } from '../lib/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { parseQuery } from '../utils/query-parser.js';

type Log = NonNullable<Awaited<ReturnType<typeof prisma.log.findFirst>>>;

// Minimal parsed-log shape used by the repository. The parser module
// wasn't present at this path in the workspace, so define the shape here
// to keep the repository self-contained.
export type ParsedLog = {
  message: string;
  // Use the repository Log severity type to stay in sync with the Prisma model
  severity: Log['severity'] | string;
  eventTime: Date;
  attributes: any;
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

  /**
   * Bulk inserts parsed log lines.
   * Note: Server sets ingestTime automatically, client payload provides eventTime.
   */
  async createMany(input: CreateLogsInput): Promise<number> {
    const { appId, sourceId, logs } = input;

    const ingestTime = new Date();

    const data = logs.map((log) => ({
      appId,
      sourceId,
      message: log.message,
      // cast severity to the Prisma enum type if it's a string
      severity: log.severity as Log['severity'],
      eventTime: log.eventTime,
      ingestTime,
      service: (log as any).service ?? null,
      attributes: log.attributes,
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
    const where: any = { appId, eventTime: { gte: startTime, lte: endTime } };
    if (severity) where.severity = severity;
    if (sourceId) where.sourceId = sourceId;
    if (search) where.message = { contains: search, mode: 'insensitive' };

    return this.prisma.log.findMany({
      where,
      select: { severity: true, eventTime: true },
      orderBy: { eventTime: 'asc' },
    });
  }

  /**
   * Fetches logs using cursor pagination (eventTime + id) scoped strictly to an appId.
   *
   * Uses a raw SQL query (instead of Prisma's typed `where`) so that `search`
   * can match against BOTH the message text AND the raw JSON attributes text.
   * Prisma's typed JSON filters require a known key path, which doesn't work
   * here since attributes have arbitrary, per-log keys.
   */
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
}