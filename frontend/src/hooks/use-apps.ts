import { useQuery } from '@tanstack/react-query'
import { getApps } from '../api/apps.api'

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
  })
}