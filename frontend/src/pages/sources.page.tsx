import { useState, useEffect } from 'react'
import { useApps } from '../hooks/use-apps'
import {
  useSources,
  useCreateSource,
  useDeleteSource,
  useRotateSourceKey,
} from '../hooks/use-sources'

export default function SourcesPage() {
  const { data: apps } = useApps()
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [revealedKey, setRevealedKey] = useState<{ sourceId: string; key: string } | null>(null)

  useEffect(() => {
    if (!selectedAppId && apps && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  const { data: sources, isLoading, error } = useSources(selectedAppId)
  const createSource = useCreateSource(selectedAppId)
  const deleteSource = useDeleteSource(selectedAppId)
  const rotateSourceKey = useRotateSourceKey(selectedAppId)

  const selectedApp = apps?.find((app) => app.id === selectedAppId)

  const handleCreate = () => {
    const name = window.prompt('Source name (e.g. Backend):')
    if (!name) return

    const environment = window.prompt('Environment (e.g. production):') || 'production'

    createSource.mutate(
      { name, environment },
      {
        onSuccess: (created) => {
          if (created.apiKey) {
            setRevealedKey({ sourceId: created.id, key: created.apiKey })
          }
        },
      }
    )
  }

  const handleRotate = (sourceId: string) => {
    if (!window.confirm('Rotate this API key? The old key will stop working immediately.')) return

    rotateSourceKey.mutate(sourceId, {
      onSuccess: (rotated) => {
        if (rotated.apiKey) {
          setRevealedKey({ sourceId: rotated.id, key: rotated.apiKey })
        }
      },
    })
  }

  const handleDelete = (sourceId: string) => {
    if (!window.confirm('Delete this source? This cannot be undone.')) return

    deleteSource.mutate(sourceId)
    if (revealedKey?.sourceId === sourceId) {
      setRevealedKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sources</h1>
          <p className="mt-1 text-sm text-slate-400">
            Managing sources for {selectedApp?.name || 'No application selected'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAppId}
            onChange={(e) => {
              setSelectedAppId(e.target.value)
              setRevealedKey(null)
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          >
            {apps?.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreate}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
          >
            + New Source
          </button>
        </div>
      </div>

      {revealedKey && (
        <div className="rounded-xl border border-cyan-700 bg-cyan-950/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-300">
              New API key — copy it now, it won't be shown again
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(revealedKey.key)}
              className="text-xs rounded-md border border-cyan-700 px-2 py-1 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
            >
              Copy
            </button>
          </div>
          <code className="block break-all text-sm text-slate-100">{revealedKey.key}</code>
        </div>
      )}

      {isLoading && <div className="text-slate-400">Loading sources...</div>}
      {error && <div className="text-red-400">Failed to load sources</div>}

      {!isLoading && !error && (
        <div className="grid gap-4">
          {sources?.map((source) => (
            <div
              key={source.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{source.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Environment: {source.environment}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Created {new Date(source.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotate(source.id)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Rotate key
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sources?.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <p className="text-slate-400">No sources found for this application.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
