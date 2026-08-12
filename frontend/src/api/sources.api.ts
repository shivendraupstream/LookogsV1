import { api } from '../lib/api'

export interface Source {
  id: string
  name: string
  environment: string
  appId: string
  apiKeyHash: string
  createdAt: string
  apiKey?: string // only present in the response right after create/rotate
}

export async function getSources(appId: string): Promise<Source[]> {
  const response = await api.get<Source[]>(`/apps/${appId}/sources`)
  return response.data
}

export async function createSource(
  appId: string,
  name: string,
  environment: string
): Promise<Source> {
  const response = await api.post<Source>(`/apps/${appId}/sources`, { name, environment })
  return response.data
}

export async function deleteSource(id: string): Promise<void> {
  await api.delete(`/sources/${id}`)
}

export async function rotateSourceKey(id: string): Promise<Source> {
  const response = await api.post<Source>(`/sources/${id}/rotate-key`)
  return response.data
}

export async function updateSource(id: string, name?: string, environment?: string): Promise<Source> {
  const response = await api.patch<Source>(`/sources/${id}`, { name, environment })
  return response.data
}
