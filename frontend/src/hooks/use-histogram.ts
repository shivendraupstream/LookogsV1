import { useQuery } from '@tanstack/react-query'
import { getHistogram } from '../api/logs.api'
import type { LogFilters } from '../api/logs.api'

export function useHistogram(
  appId: string,
  startTime: string,
  endTime: string,
  filters?: LogFilters
) {
  return useQuery({
    queryKey: ['histogram', appId, startTime, endTime, filters],
    queryFn: () => getHistogram(appId, startTime, endTime, filters),
    enabled: !!appId && !!startTime && !!endTime,
  })
}