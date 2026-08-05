import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api/logs.api'
import type { LogFilters, LogCursor } from '../api/logs.api'

export function useLogs(appId: string, filters?: LogFilters, cursor?: LogCursor) {
  return useQuery({
    queryKey: ['logs', appId, filters, cursor],
    queryFn: () => getLogs(appId, filters, cursor),
    enabled: !!appId,
  })
}