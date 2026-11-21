import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'
import './index.css'
import './components/common/InstallApp'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

// Drop cached private data before another account can render it.
useAuthStore.subscribe((state, previous) => { if (state.user?.id !== previous.user?.id || (!state.accessToken && !!previous.accessToken)) queryClient.clear() })
if (import.meta.env.PROD && "serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js")

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 2600,
              style: {
                background: '#172033',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 12px 28px rgba(23, 32, 51, 0.16)',
              },
              success: { iconTheme: { primary: '#ffffff', secondary: '#172033' } },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
