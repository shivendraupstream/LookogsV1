import {
  LogRepository,
  type FindLogsQuery,
} from "../repositories/log.repositories.js";
import {toLogDto} from "../dto/log.dto.js";
export class LogService {
  private logRepository = new LogRepository();

  

  async getLogs(query: FindLogsQuery) {
    const logs = await this.logRepository.findMany(query);
    return logs.map(toLogDto);
  }

    async getHistogram(query: {
    appId: string;
    severity?: string | undefined;
    sourceId?: string | undefined;
    search?: string | undefined;
    startTime: Date;
    endTime: Date;
  }) {
    const logs = await this.logRepository.findManyForHistogram(query);
    const { startTime, endTime } = query;
    const BUCKET_COUNT = 20;
    const bucketMs = (endTime.getTime() - startTime.getTime()) / BUCKET_COUNT;

    const buckets = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
      bucketStart: new Date(startTime.getTime() + i * bucketMs).toISOString(),
      TRACE: 0, DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0,
    }));

    for (const log of logs) {
      let index = Math.floor((log.eventTime.getTime() - startTime.getTime()) / bucketMs);
      if (index < 0) index = 0;
      if (index >= BUCKET_COUNT) index = BUCKET_COUNT - 1;

      const bucket = buckets[index];
      if (bucket) {
        bucket[log.severity as keyof (typeof buckets)[number]]++;
      }
    }

    return buckets;
  }
  async getLogbyId(appId: string, Id: string) {
    const log = await this.logRepository.findById(appId, Id);

    if (!log) {
      return null;
    }
    return toLogDto(log);
  }

  async getMetrics(appId: string, startTime: Date, endTime: Date) {
    const avgResponseTimeMs = await this.logRepository.getAvgResponseTime(appId, startTime, endTime);
    return { avgResponseTimeMs };
  }
}