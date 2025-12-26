// Production Error Handler for TraderEdge Pro
// Specifically handles the "Cannot read properties of undefined (reading 'headers')" error

export const initProductionErrorHandler = () => {
  // Only run in production or when headers errors are detected
  if (typeof window === 'undefined') return;

  let headersErrorDetected = false;
  let fallbackMode = false;

  // Global error handler specifically for headers errors
  const handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || new Error(event.message);
    
    // Check for the specific headers error
    if (error.message?.includes('Cannot read properties of undefined') && 
        error.message?.includes('headers')) {
      
      console.error('🚨 Headers error detected in production:', error);
      headersErrorDetected = true;
      
      // Prevent the error from crashing the app
      event.preventDefault();
      
      // Switch to fallback mode
      if (!fallbackMode) {
        fallbackMode = true;
        console.log('🔄 Switching to fallback mode...');
        
        // Clear any corrupted state
        try {
          // Clear problematic localStorage items
          const problematicKeys = [
            'database.auth.token',
            'db-auth-token',
            'database-auth-token'
          ];
          
          problematicKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          console.log('✅ Cleared potentially corrupted auth tokens');
        } catch (clearError) {
          console.warn('⚠️ Could not clear storage:', clearError);
        }
        
        // Dispatch a custom event to notify components
        window.dispatchEvent(new CustomEvent('headers-error-fallback', {
          detail: { error, timestamp: Date.now() }
        }));
      }
      
      return true; // Error handled
    }
    
    return false; // Let other errors through
  };

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    
    if (reason?.message?.includes('headers') || 
        reason?.message?.includes('fetch') ||
        reason?.name === 'TypeError') {
      
      console.error('🚨 Network/Headers promise rejection in production:', reason);
      
      // Prevent the rejection from crashing the app
      event.preventDefault();
      
      // Dispatch fallback event
      if (!fallbackMode) {
        fallbackMode = true;
        window.dispatchEvent(new CustomEvent('network-error-fallback', {
          detail: { reason, timestamp: Date.now() }
        }));
      }
      
      return true; // Rejection handled
    }
    
    return false; // Let other rejections through
  };

  // Add event listeners
  window.addEventListener('error', handleGlobalError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

  // Monkey patch fetch to add headers safety
  if (window.fetch && !window.fetch.toString().includes('headersPatched')) {
    const originalFetch = window.fetch;
    
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      // Ensure init object exists
      const safeInit = init || {};
      
      // Ensure headers object exists and is properly formatted
      if (!safeInit.headers) {
        safeInit.headers = {};
      }
      
      // Convert headers to a plain object if it's not already
      if (safeInit.headers && typeof safeInit.headers === 'object') {
        try {
          // If it's a Headers object, convert to plain object
          if (safeInit.headers instanceof Headers) {
            const plainHeaders: Record<string, string> = {};
            safeInit.headers.forEach((value, key) => {
              plainHeaders[key] = value;
            });
            safeInit.headers = plainHeaders;
          }
          
          // Ensure common headers are present
          const headers = safeInit.headers as Record<string, string>;
          if (!headers['Content-Type'] && (safeInit.method === 'POST' || safeInit.method === 'PUT' || safeInit.method === 'PATCH')) {
            headers['Content-Type'] = 'application/json';
          }
          
          if (!headers['Accept']) {
            headers['Accept'] = 'application/json, text/plain, */*';
          }
          
        } catch (headerError) {
          console.warn('⚠️ Headers processing error, using defaults:', headerError);
          safeInit.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          };
        }
      }
      
      // Call original fetch with safe headers
      return originalFetch.call(this, input, safeInit).catch(fetchError => {
        if (fetchError.message?.includes('headers')) {
          console.error('🚨 Fetch headers error caught and handled:', fetchError);
          
          // Dispatch fallback event
          window.dispatchEvent(new CustomEvent('fetch-error-fallback', {
            detail: { error: fetchError, url: input, timestamp: Date.now() }
          }));
          
          // Return a mock response to prevent crashes
          return new Response(JSON.stringify({ error: 'Network unavailable', fallback: true }), {
            status: 503,
            statusText: 'Service Unavailable (Fallback)',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        throw fetchError; // Re-throw other errors
      });
    };
    
    // Mark as patched
    Object.defineProperty(window.fetch, 'headersPatched', { value: true });
    console.log('✅ Fetch patched for headers safety');
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('error', handleGlobalError, true);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
  };
};

// Auto-initialize in production or when errors are detected
if (typeof window !== 'undefined') {
  // Initialize immediately
  initProductionErrorHandler();
  
  // Also initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductionErrorHandler);
  }
}
