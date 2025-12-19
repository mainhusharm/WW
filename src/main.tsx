import './polyfills'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Ensure polyfills are loaded before any other code
if (typeof window !== 'undefined') {
  console.log('🚀 Main app starting - polyfills loaded');
  console.log('Request API available:', typeof window.Request);
  console.log('Response API available:', typeof window.Response);
  console.log('Headers API available:', typeof window.Headers);
}

// Ensure the root element exists
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create root with proper error handling
const root = ReactDOM.createRoot(rootElement)

// Render with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
