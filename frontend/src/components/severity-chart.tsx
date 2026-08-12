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
  onBucketClick?: (startTime: string, endTime: string) => void
}

const SEVERITY_COLORS: Record<string, string> = {
  TRACE: '#64748b',
  DEBUG: '#94a3b8',
  INFO: '#3b82f6',
  WARN: '#eab308',
  ERROR: '#ef4444',
  FATAL: '#7f1d1d',
}

export function SeverityChart({ data, onBucketClick }: Props) {
  const first = data[0]
  const last = data[data.length - 1]

  const spanMs = first && last
    ? new Date(last.bucketStart).getTime() - new Date(first.bucketStart).getTime()
    : 0

  const crossesDayBoundary = first && last
    ? new Date(first.bucketStart).toDateString() !== new Date(last.bucketStart).toDateString()
    : false

  const formatLabel = (iso: string): string => {
    const date = new Date(iso)

    if (crossesDayBoundary) {
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    if (spanMs < 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Each bucket's width, derived from the gap between consecutive buckets —
  // needed to know where a clicked bucket actually ENDS, not just starts.
  const bucketWidthMs = data.length > 1
    ? new Date(data[1].bucketStart).getTime() - new Date(data[0].bucketStart).getTime()
    : 60 * 60 * 1000

  const chartData = data.map((bucket) => ({
    ...bucket,
    label: formatLabel(bucket.bucketStart),
    bucketEnd: new Date(new Date(bucket.bucketStart).getTime() + bucketWidthMs).toISOString(),
  }))

  const handleBarClick = (barData: any) => {
    if (onBucketClick && barData?.bucketStart && barData?.bucketEnd) {
      onBucketClick(barData.bucketStart, barData.bucketEnd)
    }
  }

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
            <Bar
              key={severity}
              dataKey={severity}
              stackId="a"
              fill={SEVERITY_COLORS[severity]}
              onClick={handleBarClick}
              cursor="pointer"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {onBucketClick && (
        <p className="text-xs text-slate-500 mt-2">Click a bar to zoom into that time window</p>
      )}
    </div>
  )
}