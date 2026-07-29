import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', path: '/' },
  { label: 'Applications', path: '/apps' },
  { label: 'Sources', path: '/sources' },
  { label: 'Logs', path: '/logs' },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cyan-400">Lookogs</h1>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}