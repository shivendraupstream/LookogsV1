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