export function Header() {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          Lookogs Dashboard
        </h2>
      </div>

      <div className="text-sm text-slate-400">
        Backend: http://localhost:3000
      </div>
    </header>
  )
}