import { useApps, useCreateApp, useDeleteApp } from '../hooks/use-apps'
import  { useState } from 'react'


export default function AppsPage() {
  const { data: apps, isLoading, error } = useApps()
  const createApp = useCreateApp()
  const deleteApp = useDeleteApp()
  const [revealedKey, setRevealedKey] = useState<{ appName: string; sourceName: string; key: string } | null>(null)

  const handleCreate = () => {
    const name = window.prompt('Application name:')
    if (!name) return

    const description = window.prompt('Description (optional):') || undefined

    createApp.mutate(
      { name, description },
      {
        onSuccess: (created: any) => {
          if (created.defaultSource?.apiKey) {
            setRevealedKey({
              appName: created.name,
              sourceName: created.defaultSource.name,
              key: created.defaultSource.apiKey,
            })
          }
        },
      }
    )
  }

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This will also delete all its sources and logs. This cannot be undone.`)) return
    deleteApp.mutate(id)
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading applications...</div>
  }

  if (error) {
    return <div className="text-red-400">Failed to load applications</div>
  }

  return (
    <div className="space-y-6">
      {revealedKey && (
        <div className="rounded-xl border border-cyan-700 bg-cyan-950/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-cyan-300">
              "{revealedKey.appName}" is ready — copy this key now, it won't be shown again
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(revealedKey.key)}
              className="text-xs rounded-md border border-cyan-700 px-2 py-1 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
            >
              Copy
            </button>
          </div>
          <code className="block break-all text-sm text-slate-100">{revealedKey.key}</code>
          <p className="text-xs text-slate-500 mt-2">
            A "{revealedKey.sourceName}" source was created automatically — you can rename it or add more sources from the Sources page.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">Applications</h1>

        <button
          onClick={handleCreate}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
        >
          + New Application
        </button>
      </div>

      <div className="grid gap-4">
        {apps?.map((app) => (
          <div
            key={app.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  {app.name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {app.description || 'No description provided'}
                </p>
              </div>

             <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  Active
                </span>
                <button
                  onClick={() => handleDelete(app.id, app.name)}
                  className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-1 text-xs text-red-400 hover:bg-red-950/50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Created {new Date(app.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}

        {apps?.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-slate-400">No applications found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
