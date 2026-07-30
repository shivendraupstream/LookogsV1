import { prisma } from '../lib/prisma.js';

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
   */
  async findMany(query: FindLogsQuery): Promise<Log[]> {
    const { appId, severity, sourceId, search, startTime, endTime, cursor, limit = 50 } = query;

    const where: any = { appId };

    if (severity) where.severity = severity;
    if (sourceId) where.sourceId = sourceId;

    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (startTime || endTime) {
      where.eventTime = {};
      if (startTime) where.eventTime.gte = startTime;
      if (endTime) where.eventTime.lte = endTime;
    }

    // Cursor pagination logic ( eventTime DESC, id DESC)
    if (cursor) {
      where.OR = [
        { eventTime: { lt: cursor.eventTime } },
        {
          eventTime: cursor.eventTime,
          id: { lt: cursor.id },
        },
      ];
    }

    const logs = await this.prisma.log.findMany({
      where,
      orderBy: [
        { eventTime: 'desc' },
        { id: 'desc' },
      ],
      take: limit,
    });

    return logs;
  }

  async findById(appId: string, id: string): Promise<Log | null> {
    return this.prisma.log.findFirst({
      where: { id, appId },
    });
  }
}