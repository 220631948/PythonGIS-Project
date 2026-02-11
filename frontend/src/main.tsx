import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './sentry'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)

// Create a client
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
