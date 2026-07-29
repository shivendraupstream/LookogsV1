import { useQuery } from '@tanstack/react-query'
import { getLogs, type LogFilters } from '../api/logs.api'

export function useLogs(appId: string, filters?: LogFilters) {
  return useQuery({
    queryKey: ['logs', appId, filters],
    queryFn: () => getLogs(appId, filters),
    enabled: !!appId,
  })
}