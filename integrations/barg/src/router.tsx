import { BrowserRouter, type BrowserRouterProps } from 'react-router-dom'

// Prefix-aware router: hosting also serves the builder directly on refresh.
export function Router(props: BrowserRouterProps) {
  return <BrowserRouter {...props} basename={import.meta.env.BASE_URL.replace(/\/$/, '')} />
}
