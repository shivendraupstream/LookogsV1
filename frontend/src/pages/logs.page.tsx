import { useApps } from '../hooks/use-apps'
import { useLogs } from '../hooks/use-logs'
import { SeverityBadge } from '../components/severity-badge'

export default function LogsPage() {
  const { data: apps } = useApps()

  // Use the first app for now
  const selectedAppId = apps?.[0]?.id || ''

  const { data: logs, isLoading, error } = useLogs(selectedAppId)

  if (isLoading) {
    return <div className="text-slate-400">Loading logs...</div>
  }

  if (error) {
    return <div className="text-red-400">Failed to load logs</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Viewing logs for {apps?.[0]?.name || 'No application selected'}
          </p>
        </div>

        <div className="text-sm text-slate-500">
          {logs?.length || 0} log entries
        </div>
      </div>

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
              <tr
                key={log.id}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-3 align-top">
                  <SeverityBadge severity={log.severity} />
                </td>

                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-slate-100">
                    {log.message}
                  </div>
                </td>

                <td className="px-4 py-3 align-top text-slate-400">
                  {log.service || '—'}
                </td>

                <td className="px-4 py-3 align-top text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs?.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            No logs found for this application.
          </div>
        )}
      </div>
    </div>
  )
}