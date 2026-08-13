import { NavLink } from 'react-router-dom'
import { logout } from '../lib/auth.ts'

const links = [
  { label: 'Dashboard', path: '/' },
  { label: 'Applications', path: '/apps' },
  { label: 'Sources', path: '/sources' },
  { label: 'Logs', path: '/logs' },
  { label: 'Alerts', path: '/alerts' },
]

export function Sidebar() {
  const handleLogout = () => {
    if (window.confirm('Log out?')) {
      logout()
    }
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cyan-400">Lookogs</h1>
      </div>

      <nav className="space-y-2 flex-1">
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

      <button
        onClick={handleLogout}
        className="mt-4 rounded-lg px-3 py-2 text-left text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
      >
        Log out
      </button>
    </aside>
  )
}