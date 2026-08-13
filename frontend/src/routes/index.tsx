import { createBrowserRouter } from 'react-router-dom'
import DashboardLayout from '../layouts/dashboard.layout'
import DashboardPage from '../pages/dashboard.page'
import AppsPage from '../pages/apps.page'
import SourcesPage from '../pages/sources.page'
import LogsPage from '../pages/logs.page'
import TriggersPage from '../pages/triggers.page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'apps', element: <AppsPage /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'alerts', element: <TriggersPage /> },
    ],
  },
])