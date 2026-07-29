import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api/logs.api'

export function useLogs(appId: string) {
  return useQuery({
    queryKey: ['logs', appId],
    queryFn: () => getLogs(appId),
    enabled: !!appId,
  })
}