import { useApps } from '../hooks/use-apps'

export default function AppsPage() {
  const { data: apps, isLoading, error } = useApps()

  if (isLoading) {
    return <div className="text-slate-400">Loading applications...</div>
  }

  if (error) {
    return <div className="text-red-400">Failed to load applications</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-100">Applications</h1>

        <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400">
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

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                Active
              </span>
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