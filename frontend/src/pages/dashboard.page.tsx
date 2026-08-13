import { useState, useEffect, useMemo } from 'react'
import { useApps } from '../hooks/use-apps'
import { useHistogram } from '../hooks/use-histogram'
import { useMetrics } from '../hooks/use-metrics'
import { SeverityChart } from '../components/severity-chart'

const RANGE_OPTIONS = [
  { label: 'Last 1h', value: '1h', ms: 60 * 60 * 1000 },
  { label: 'Last 24h', value: '24h', ms: 24 * 60 * 60 * 1000 },
  { label: 'Last 7d', value: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: apps } = useApps()
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [range, setRange] = useState<string>('24h')

  useEffect(() => {
    if (!selectedAppId && apps && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  const { startTime, endTime } = useMemo(() => {
    const now = new Date()
    const option = RANGE_OPTIONS.find((r) => r.value === range) || RANGE_OPTIONS[1]
    return {
      startTime: new Date(now.getTime() - option.ms).toISOString(),
      endTime: now.toISOString(),
    }
  }, [range])

  const { data: histogramData, isLoading: histLoading } = useHistogram(selectedAppId, startTime, endTime)
  const { data: metrics, isLoading: metricsLoading } = useMetrics(selectedAppId, startTime, endTime)

  const selectedApp = apps?.find((app) => app.id === selectedAppId)

  const { totalLogs, errorCount, errorRate } = useMemo(() => {
    if (!histogramData) return { totalLogs: 0, errorCount: 0, errorRate: 0 }

    let total = 0
    let errors = 0
    for (const bucket of histogramData) {
      total += bucket.TRACE + bucket.DEBUG + bucket.INFO + bucket.WARN + bucket.ERROR + bucket.FATAL
      errors += bucket.ERROR + bucket.FATAL
    }
    return {
      totalLogs: total,
      errorCount: errors,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
    }
  }, [histogramData])

  const isLoading = histLoading || metricsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview for {selectedApp?.name || 'No application selected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          >
            {apps?.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  range === option.value
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-slate-400">Loading metrics...</div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total logs"
              value={totalLogs.toLocaleString()}
              sub={RANGE_OPTIONS.find((r) => r.value === range)?.label}
            />
            <StatCard
              label="Error rate"
              value={`${errorRate.toFixed(2)}%`}
              sub={`${errorCount.toLocaleString()} ERROR/FATAL logs`}
            />
            <StatCard
              label="Avg response time"
              value={
                metrics?.avgResponseTimeMs != null
                  ? `${Math.round(metrics.avgResponseTimeMs)}ms`
                  : '—'
              }
              sub={
                metrics?.avgResponseTimeMs != null
                  ? undefined
                  : 'No responseTimeMs data in this range'
              }
            />
          </div>

          {histogramData && histogramData.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-300 mb-2">
                Throughput & severity breakdown
              </h2>
              <SeverityChart data={histogramData} />
            </div>
          )}
        </>
      )}
    </div>
  )
}