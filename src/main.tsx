import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Aggressive React loading verification
const waitForReact = () => {
  return new Promise<void>((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkReact = () => {
      attempts++;
      
      // Check if React is fully loaded
      if (typeof React !== 'undefined' && 
          typeof React.useState === 'function' &&
          typeof React.useEffect === 'function' &&
          typeof React.useContext === 'function' &&
          typeof React.useLayoutEffect === 'function' &&
          typeof ReactDOM !== 'undefined' &&
          typeof ReactDOM.createRoot === 'function') {
        console.log('✅ React fully loaded after', attempts, 'attempts');
        resolve();
        return;
      }
      
      if (attempts >= maxAttempts) {
        reject(new Error(`React failed to load after ${maxAttempts} attempts`));
        return;
      }
      
      // Wait a bit and try again
      setTimeout(checkReact, 100);
    };
    
    checkReact();
  });
};

// Ensure React is properly loaded before rendering
if (typeof React === 'undefined') {
  throw new Error('React is not loaded properly');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Wait for React to be fully loaded before rendering
waitForReact()
  .then(() => {
    try {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )
    } catch (error) {
      console.error('Failed to render React app:', error);
      throw error;
    }
  })
  .catch((error) => {
    console.error('Failed to load React:', error);
    // Fallback error display
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>React Loading Error</h1>
        <p>Failed to load React properly. This might be a bundling issue.</p>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: left;">
          <h3>Troubleshooting:</h3>
          <ul>
            <li>Clear browser cache and reload</li>
            <li>Check if JavaScript is enabled</li>
            <li>Try a different browser</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    `;
  });
