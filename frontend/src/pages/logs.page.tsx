import { useState, useEffect, useMemo, Fragment } from 'react'
import { useApps } from '../hooks/use-apps'
import { useLogs } from '../hooks/use-logs'
import { SeverityBadge } from '../components/severity-badge'
import { useHistogram } from '../hooks/use-histogram'
import { SeverityChart } from '../components/severity-chart'
import { useSavedViews, useCreateSavedView, useDeleteSavedView } from '../hooks/use-saved-views'

export default function LogsPage() {
  const { data: apps } = useApps()
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('all')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [selectedViewId, setSelectedViewId] = useState<string>('')

  const getTimeRangeParams = (): { startTime?: string; endTime?: string } => {
    const now = new Date()

    if (timeRange === '15m') {
      return { startTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString() }
    }
    if (timeRange === '1h') {
      return { startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString() }
    }
    if (timeRange === '24h') {
      return { startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() }
    }
    if (timeRange === 'custom') {
      return {
        startTime: customStart ? new Date(customStart).toISOString() : undefined,
        endTime: customEnd ? new Date(customEnd).toISOString() : undefined,
      }
    }
    return {} // 'all' — no time restriction
  }

  const { startTime: histStart, endTime: histEnd } = useMemo(() => {
    const now = new Date()
    const params = getTimeRangeParams()
    return {
      startTime: params.startTime || new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: params.endTime || now.toISOString(),
    }
  }, [timeRange, customStart, customEnd])

  useEffect(() => {
    if (!selectedAppId && apps && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  const { data: logs, isLoading, error } = useLogs(selectedAppId, {
    severity: severityFilter || undefined,
    search: searchInput || undefined,
    ...getTimeRangeParams(),
  })

  const { data: histogramData } = useHistogram(selectedAppId, histStart, histEnd, {
    severity: severityFilter || undefined,
    search: searchInput || undefined,
  })

  const { data: savedViews } = useSavedViews(selectedAppId)
  const createSavedView = useCreateSavedView(selectedAppId)
  const deleteSavedView = useDeleteSavedView(selectedAppId)

  const selectedApp = apps?.find((app) => app.id === selectedAppId)

  const toggleExpand = (id: string) => {
    setExpandedLogId((current) => (current === id ? null : id))
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/40 text-yellow-100 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleSaveView = () => {
    const name = window.prompt('Name this saved view:')
    if (!name) return

    createSavedView.mutate({
      name,
      filters: {
        severity: severityFilter || undefined,
        search: searchInput || undefined,
        timeRange,
        customStart: customStart || undefined,
        customEnd: customEnd || undefined,
      },
    })
  }

  const handleLoadView = (viewId: string) => {
    setSelectedViewId(viewId)
    if (!viewId) return

    const view = savedViews?.find((v) => v.id === viewId)
    if (!view) return

    setSeverityFilter(view.filters.severity || '')
    setSearchInput(view.filters.search || '')
    setTimeRange(view.filters.timeRange || 'all')
    setCustomStart(view.filters.customStart || '')
    setCustomEnd(view.filters.customEnd || '')
  }

  const handleDeleteView = () => {
    if (!selectedViewId) return
    if (!window.confirm('Delete this saved view?')) return

    deleteSavedView.mutate(selectedViewId)
    setSelectedViewId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Viewing logs for {selectedApp?.name || 'No application selected'}
          </p>
        </div>

        <div className="flex items-center gap-4">
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

          <div className="text-sm text-slate-500">
            {logs?.length || 0} log entries
          </div>
        </div>
      </div>

      {histogramData && histogramData.length > 0 && (
        <SeverityChart data={histogramData} />
      )}

      <div className="flex items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All severities</option>
          <option value="TRACE">Trace</option>
          <option value="DEBUG">Debug</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warn</option>
          <option value="ERROR">Error</option>
          <option value="FATAL">Fatal</option>
        </select>

        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        {[
          { label: '15m', value: '15m' },
          { label: '1h', value: '1h' },
          { label: '24h', value: '24h' },
          { label: 'All time', value: 'all' },
          { label: 'Custom', value: 'custom' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              timeRange === option.value
                ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}

        {timeRange === 'custom' && (
          <>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-slate-500">to</span>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
        <span className="text-sm text-slate-400">Saved views:</span>

        <select
          value={selectedViewId}
          onChange={(e) => handleLoadView(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">— Select a saved view —</option>
          {savedViews?.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>

        {selectedViewId && (
          <button
            onClick={handleDeleteView}
            className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/50 transition-colors"
          >
            Delete view
          </button>
        )}

        <button
          onClick={handleSaveView}
          className="ml-auto rounded-lg border border-cyan-700 bg-cyan-950/30 px-3 py-1.5 text-sm text-cyan-300 hover:bg-cyan-950/50 transition-colors"
        >
          Save current filters
        </button>
      </div>

      {isLoading && <div className="text-slate-400">Loading logs...</div>}
      {error && <div className="text-red-400">Failed to load logs</div>}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full border-collapse">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">
                  Severity
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">
                  Message
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">
                  Service
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">
                  Timestamp
                </th>
              </tr>
            </thead>

            <tbody>
              {logs?.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 align-top">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-slate-100">
                        {highlightMatch(log.message, searchInput)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-400">
                      {log.service || '—'}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>

                  {expandedLogId === log.id && (
                    <tr className="border-b border-slate-800 bg-slate-950/30">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">
                            Attributes
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(
                                JSON.stringify(log.attributes, null, 2)
                              )
                            }}
                            className="text-xs rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            Copy as JSON
                          </button>
                        </div>

                        <table className="w-full text-sm">
                          <tbody>
                            {Object.entries(log.attributes || {}).map(([key, value]) => (
                              <tr key={key}>
                                <td className="pr-4 py-1 text-slate-400 align-top w-1/4">
                                  {key}
                                </td>
                                <td className="py-1 text-slate-200 break-all">
                                  {String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {logs?.length === 0 && (
            <div className="p-10 text-center text-slate-400">
              No logs found for this application.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
