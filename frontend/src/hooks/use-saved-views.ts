import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSavedViews, createSavedView, deleteSavedView } from '../api/saved-views.api'
import type { SavedViewFilters } from '../api/saved-views.api'

export function useSavedViews(appId: string) {
  return useQuery({
    queryKey: ['saved-views', appId],
    queryFn: () => getSavedViews(appId),
    enabled: !!appId,
  })
}

export function useCreateSavedView(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { name: string; filters: SavedViewFilters }) =>
      createSavedView(appId, params.name, params.filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', appId] })
    },
  })
}

export function useDeleteSavedView(appId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSavedView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views', appId] })
    },
  })
}