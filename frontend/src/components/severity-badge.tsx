interface Props {
  severity: string
}

const colors: Record<string, string> = {
  INFO: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  WARN: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  ERROR: 'bg-red-500/20 text-red-300 border-red-500/30',
  DEBUG: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export function SeverityBadge({ severity }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
        colors[severity] || colors.DEBUG
      }`}
    >
      {severity}
    </span>
  )
}