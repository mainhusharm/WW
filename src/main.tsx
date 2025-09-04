import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

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
