import { api } from '../lib/api'
import type { App } from '../types/app'

export async function getApps(): Promise<App[]> {
  const response = await api.get('/apps')
  return response.data
}

export async function createApp(name: string, description?: string): Promise<App> {
  const response = await api.post<App>('/apps', { name, description })
  return response.data
}

export async function deleteApp(id: string): Promise<void> {
  await api.delete(`/apps/${id}`)
}