import { api } from '../lib/api'
import type { App } from '../types/app'

export async function getApps(): Promise<App[]> {
  const response = await api.get('/apps')
  return response.data
}