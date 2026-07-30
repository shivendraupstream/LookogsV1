import { api } from '../lib/api'
import type { Log } from '../types/log'

interface LogsResponse {
  logs: Log[]
}

export interface LogFilters {
  severity?: string
  search?: string
  startTime?: string
  endTime?: string
}

export async function getLogs(appId: string, filters?: LogFilters): Promise<Log[]> {
  const response = await api.get<LogsResponse>('/logs', {
    params: { appId, ...filters },
  })

  return response.data.logs
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