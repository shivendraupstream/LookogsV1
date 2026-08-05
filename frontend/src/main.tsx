import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AuthGate } from './components/auth-gate'
import Appsignal from "@appsignal/javascript";
import './index.css'

const queryClient = new QueryClient()

const appsignal = new Appsignal({
  key: "5e54d9a5-04fd-42b0-a7a4-c4d1256daeca",
});

appsignal.demo()
;
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </QueryClientProvider>
  </React.StrictMode>,
)