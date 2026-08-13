import { api } from '../lib/api'

export interface Trigger {
  id: string
  name: string
  query: string
  thresholdCount: number
  windowMinutes: number
  webhookUrl: string
  cooldownMinutes: number
  lastNotifiedAt: string | null
  appId: string
  createdAt: string
}

export interface CreateTriggerInput {
  name: string
  query: string
  thresholdCount: number
  windowMinutes: number
  webhookUrl: string
  cooldownMinutes: number
}

export async function getTriggers(appId: string): Promise<Trigger[]> {
  const response = await api.get<Trigger[]>(`/apps/${appId}/triggers`)
  return response.data
}

export async function createTrigger(appId: string, input: CreateTriggerInput): Promise<Trigger> {
  const response = await api.post<Trigger>(`/apps/${appId}/triggers`, input)
  return response.data
}

export async function deleteTrigger(id: string): Promise<void> {
  await api.delete(`/triggers/${id}`)
}