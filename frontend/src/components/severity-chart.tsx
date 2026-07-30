import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HistogramBucket } from '../api/logs.api'

interface Props {
  data: HistogramBucket[]
}

const SEVERITY_COLORS: Record<string, string> = {
  TRACE: '#64748b',
  DEBUG: '#94a3b8',
  INFO: '#3b82f6',
  WARN: '#eab308',
  ERROR: '#ef4444',
  FATAL: '#7f1d1d',
}

export function SeverityChart({ data }: Props) {
  const chartData = data.map((bucket) => ({
    ...bucket,
    label: new Date(bucket.bucketStart).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155' }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          {Object.keys(SEVERITY_COLORS).map((severity) => (
            <Bar key={severity} dataKey={severity} stackId="a" fill={SEVERITY_COLORS[severity]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}