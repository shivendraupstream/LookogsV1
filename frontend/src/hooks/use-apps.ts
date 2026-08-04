import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApps, createApp, deleteApp} from '../api/apps.api'

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: getApps,
  })
}

export function useCreateApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      createApp(params.name, params.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}

export function useDeleteApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
    },
  })
}