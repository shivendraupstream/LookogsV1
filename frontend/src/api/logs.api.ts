import { api } from '../lib/api'
import type { Log } from '../types/log'

interface LogsResponse {
  logs: Log[]
}

export async function getLogs(appId: string): Promise<Log[]> {
  const response = await api.get<LogsResponse>('/logs', {
    params: { appId },
  })

  return response.data.logs
}