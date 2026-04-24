import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { getRouter } from './router'
import './styles.css'

const queryClient = new QueryClient()
const router = getRouter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BlinkUIProvider theme="linear" darkMode="system">
        <Toaster />
        <RouterProvider router={router} />
      </BlinkUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
