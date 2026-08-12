import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSources, createSource, deleteSource, rotateSourceKey, updateSource} from '../api/sources.api'

export function useSources(appId: string) {
  return useQuery({
    queryKey: ['sources', appId],
    queryFn: () => getSources(appId),
    enabled: !!appId,
  })
}

export function useCreateSource(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { name: string; environment: string }) =>
      createSource(appId, params.name, params.environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', appId] })
    },
  })
}

export function useDeleteSource(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', appId] })
    },
  })
}

export function useRotateSourceKey(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rotateSourceKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', appId] })
    },
  })
}

export function useUpdateSource(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; name?: string; environment?: string }) =>
      updateSource(params.id, params.name, params.environment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sources', appId] })
    },
  })
}
