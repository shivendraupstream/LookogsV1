import { useState, useEffect } from 'react'
import { useApps } from '../hooks/use-apps'
import { useTriggers, useCreateTrigger, useDeleteTrigger } from '../hooks/use-triggers'

export default function TriggersPage() {
  const { data: apps } = useApps()
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [thresholdCount, setThresholdCount] = useState('5')
  const [windowMinutes, setWindowMinutes] = useState('5')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [cooldownMinutes, setCooldownMinutes] = useState('15')

  useEffect(() => {
    if (!selectedAppId && apps && apps.length > 0) {
      setSelectedAppId(apps[0].id)
    }
  }, [apps, selectedAppId])

  const { data: triggers, isLoading, error } = useTriggers(selectedAppId)
  const createTrigger = useCreateTrigger(selectedAppId)
  const deleteTrigger = useDeleteTrigger(selectedAppId)

  const selectedApp = apps?.find((app) => app.id === selectedAppId)

  const resetForm = () => {
    setName('')
    setQuery('')
    setThresholdCount('5')
    setWindowMinutes('5')
    setWebhookUrl('')
    setCooldownMinutes('15')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !query || !webhookUrl) return

    createTrigger.mutate(
      {
        name,
        query,
        thresholdCount: Number(thresholdCount),
        windowMinutes: Number(windowMinutes),
        webhookUrl,
        cooldownMinutes: Number(cooldownMinutes),
      },
      {
        onSuccess: () => {
          resetForm()
          setShowForm(false)
        },
      }
    )
  }

  const handleDelete = (id: string, triggerName: string) => {
    if (!window.confirm(`Delete trigger "${triggerName}"?`)) return
    deleteTrigger.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Alerts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Managing triggers for {selectedApp?.name || 'No application selected'}
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

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
          >
            {showForm ? 'Cancel' : '+ New Alert'}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Alert name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="High error rate"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/..."
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Query — same syntax as the Logs page (e.g. severity:error)
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="severity:error"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Trigger if matches ≥
              </label>
              <input
                type="number"
                min={1}
                value={thresholdCount}
                onChange={(e) => setThresholdCount(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Within (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={windowMinutes}
                onChange={(e) => setWindowMinutes(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Cooldown (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Checked every 60 seconds. Won't notify again within the cooldown
            window even if the condition keeps matching.
          </p>

          <button
            type="submit"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
          >
            Create Alert
          </button>
        </form>
      )}

      {isLoading && <div className="text-slate-400">Loading alerts...</div>}
      {error && <div className="text-red-400">Failed to load alerts</div>}

      {!isLoading && !error && (
        <div className="grid gap-4">
          {triggers?.map((trigger) => (
            <div
              key={trigger.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{trigger.name}</h2>
                  <p className="mt-1 text-sm text-slate-400 font-mono">{trigger.query}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Fires at ≥{trigger.thresholdCount} matches in {trigger.windowMinutes}m,
                    cooldown {trigger.cooldownMinutes}m
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {trigger.lastNotifiedAt
                      ? `Last fired: ${new Date(trigger.lastNotifiedAt).toLocaleString()}`
                      : 'Never fired yet'}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(trigger.id, trigger.name)}
                  className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {triggers?.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 p-10 text-center">
              <p className="text-slate-400">No alerts set up for this application yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}