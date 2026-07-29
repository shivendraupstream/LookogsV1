import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/sidebar'
import { Header } from '../components/header'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}