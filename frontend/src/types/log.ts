export interface Log {
  id: string
  severity: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  timestamp: string
  hostname: string | null
  service: string | null
  version: string | null
  attributes: Record<string, unknown>
}