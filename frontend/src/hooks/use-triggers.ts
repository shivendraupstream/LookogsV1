import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTriggers, createTrigger, deleteTrigger } from '../api/triggers.api'
import type { CreateTriggerInput } from '../api/triggers.api'

export function useTriggers(appId: string) {
  return useQuery({
    queryKey: ['triggers', appId],
    queryFn: () => getTriggers(appId),
    enabled: !!appId,
  })
}

export function useCreateTrigger(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTriggerInput) => createTrigger(appId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers', appId] })
    },
  })
}

export function useDeleteTrigger(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTrigger(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggers', appId] })
    },
  })
}