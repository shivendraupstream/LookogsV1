import { api } from '../lib/api'

export interface SavedViewFilters {
  severity?: string
  search?: string
  timeRange?: string
  customStart?: string
  customEnd?: string
}

export interface SavedView {
  id: string
  name: string
  filters: SavedViewFilters
  appId: string
  createdAt: string
}

export async function getSavedViews(appId: string): Promise<SavedView[]> {
  const response = await api.get<SavedView[]>(`/apps/${appId}/views`)
  return response.data
}

export async function createSavedView(
  appId: string,
  name: string,
  filters: SavedViewFilters
): Promise<SavedView> {
  const response = await api.post<SavedView>(`/apps/${appId}/views`, { name, filters })
  return response.data
}

export async function deleteSavedView(id: string): Promise<void> {
  await api.delete(`/views/${id}`)
}