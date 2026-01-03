/**
 * CORS Fix Injection Script
 * This script can be injected into the existing customer service dashboard to fix CORS issues
 */

(function() {
    'use strict';
    
    console.log('🔧 CORS Fix Injection Script Loaded');
    
    const BACKEND_URL = 'https://backend-ox9b.onrender.com';
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    
    // Override the fetch function to use CORS proxy
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
        // Check if this is a request to our backend
        if (typeof url === 'string' && url.includes('node-backend-g1mk.onrender.com')) {
            console.log('🔄 Intercepting backend request:', url);
            
            // Use CORS proxy
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            console.log('🔄 Using CORS proxy:', proxyUrl);
            
            return originalFetch(proxyUrl, options);
        }
        
        // For all other requests, use original fetch
        return originalFetch(url, options);
    };
    
    // Also override XMLHttpRequest for older code
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string' && url.includes('node-backend-g1mk.onrender.com')) {
            console.log('🔄 Intercepting XHR request:', url);
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            console.log('🔄 Using CORS proxy for XHR:', proxyUrl);
            return originalXHROpen.call(this, method, proxyUrl, ...args);
        }
        return originalXHROpen.call(this, method, url, ...args);
    };
    
    // Test the fix
    setTimeout(async () => {
        try {
            console.log('🧪 Testing CORS fix...');
            const response = await fetch(`${BACKEND_URL}/api/users`);
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ CORS fix working! Users loaded:', data.count);
                
                // Show success message on page
                const message = document.createElement('div');
                message.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                `;
                message.innerHTML = '✅ CORS Fix Applied! Customer data should now load.';
                document.body.appendChild(message);
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 5000);
                
            } else {
                console.error('❌ CORS fix failed:', data.error);
            }
        } catch (error) {
            console.error('❌ CORS fix test failed:', error);
        }
    }, 2000);
    
    console.log('✅ CORS Fix Injection Complete');
})();
