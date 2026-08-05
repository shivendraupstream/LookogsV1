import { api } from '../lib/api'
import type { Log } from '../types/log'

export interface LogCursor {
  id: string
  eventTime: string
}

interface LogsResponse {
  logs: Log[]
  nextCursor: LogCursor | null
}

export interface LogFilters {
  severity?: string
  search?: string
  query?: string
  startTime?: string
  endTime?: string
}

export async function getLogs(
  appId: string,
  filters?: LogFilters,
  cursor?: LogCursor
): Promise<LogsResponse> {
  const response = await api.get<LogsResponse>('/logs', {
    params: {
      appId,
      ...filters,
      cursorId: cursor?.id,
      cursorTime: cursor?.eventTime,
    },
  })

  return response.data
}

export interface HistogramBucket {
  bucketStart: string
  TRACE: number
  DEBUG: number
  INFO: number
  WARN: number
  ERROR: number
  FATAL: number
}

export async function getHistogram(
  appId: string,
  startTime: string,
  endTime: string,
  filters?: LogFilters
): Promise<HistogramBucket[]> {
  const response = await api.get<{ buckets: HistogramBucket[] }>('/logs/histogram', {
    params: { appId, startTime, endTime, severity: filters?.severity, search: filters?.search },
  })
  return response.data.buckets
}