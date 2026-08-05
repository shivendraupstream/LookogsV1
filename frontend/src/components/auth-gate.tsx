import { useState, useEffect, type ReactNode, type FormEvent } from 'react'
import { api } from '../lib/api'

interface Props {
  children: ReactNode
}

export function AuthGate({ children }: Props) {
  const [checked, setChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const verify = async (user: string, pass: string) => {
    try {
      await api.get('/apps', { auth: { username: user, password: pass } })
      localStorage.setItem('lookogs_username', user)
      localStorage.setItem('lookogs_password', pass)
      setAuthenticated(true)
      setError('')
    } catch {
      setError('Invalid username or password')
      localStorage.removeItem('lookogs_username')
      localStorage.removeItem('lookogs_password')
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('lookogs_username')
    const storedPass = localStorage.getItem('lookogs_password')

    if (storedUser && storedPass) {
      verify(storedUser, storedPass).finally(() => setChecked(true))
    } else {
      setChecked(true)
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    verify(username, password)
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4"
        >
          <h1 className="text-xl font-bold text-slate-100">Lookogs Login</h1>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
          >
            Log in
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
