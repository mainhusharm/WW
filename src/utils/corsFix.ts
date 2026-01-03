/**
 * Universal CORS Fix
 * This module automatically fixes CORS issues across the entire application
 */

// Store original fetch function
const originalFetch = window.fetch;

// Override fetch to automatically handle CORS issues
window.fetch = function(url: string | Request | URL, options: RequestInit = {}) {
  // Convert URL to string if needed
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Check if this is a request to any of our backends
  if (urlString.includes('node-backend-g1mk.onrender.com') ||
      urlString.includes('backend-bkt7.onrender.com') ||
      urlString.includes('backend-8j0e.onrender.com')) {
    
    console.log('🔄 CORS Fix: Intercepting request to', urlString);
    
    // Use CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlString)}`;
    console.log('🔄 CORS Fix: Using proxy', proxyUrl);
    
    return originalFetch(proxyUrl, options);
  }
  
  // For all other requests, use original fetch
  return originalFetch(url, options);
};

// Store original XMLHttpRequest open method
const originalXHROpen = XMLHttpRequest.prototype.open;

// Override XMLHttpRequest for older code
XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  const urlString = typeof url === 'string' ? url : url.toString();
  
  // Check if this is a request to any of our backends
  if (urlString.includes('node-backend-g1mk.onrender.com') ||
      urlString.includes('backend-bkt7.onrender.com') ||
      urlString.includes('backend-8j0e.onrender.com')) {
    
    console.log('🔄 CORS Fix: Intercepting XHR request to', urlString);
    
    // Use CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlString)}`;
    console.log('🔄 CORS Fix: Using XHR proxy', proxyUrl);
    
    return originalXHROpen.call(this, method, proxyUrl, ...args);
  }
  
  // For all other requests, use original open
  return originalXHROpen.call(this, method, url, ...args);
};

console.log('✅ CORS Fix: Applied universal CORS fix to all API calls');

export default {};