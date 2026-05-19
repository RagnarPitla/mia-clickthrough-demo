import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import AppRouter from './AppRouter.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { bootstrapDemoMode } from './services/demoBootstrap'

bootstrapDemoMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
)
