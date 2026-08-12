import { useQuery } from '@tanstack/react-query'
import { getMetrics } from '../api/logs.api'

export function useMetrics(appId: string, startTime: string, endTime: string) {
  return useQuery({
    queryKey: ['metrics', appId, startTime, endTime],
    queryFn: () => getMetrics(appId, startTime, endTime),
    enabled: !!appId && !!startTime && !!endTime,
  })
}