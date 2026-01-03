/**
 * Console CORS Fix Script
 * Run this in the browser console on your customer service dashboard
 */

console.log('🔧 Starting CORS Fix...');

// Configuration
const BACKEND_URL = 'https://backend-ox9b.onrender.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Store original fetch function
const originalFetch = window.fetch;

// Override fetch to use CORS proxy
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
async function testCORSFix() {
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
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                border-left: 4px solid #28a745;
            `;
            message.innerHTML = '✅ CORS Fix Applied! Customer data should now load.';
            document.body.appendChild(message);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 5000);
            
            return true;
        } else {
            console.error('❌ CORS fix failed:', data.error);
            return false;
        }
    } catch (error) {
        console.error('❌ CORS fix test failed:', error);
        return false;
    }
}

// Run test after a short delay
setTimeout(testCORSFix, 1000);

// Also provide a manual test function
window.testCORS = testCORSFix;

console.log('✅ CORS Fix Applied! Try refreshing the page or clicking "Load Users" again.');
console.log('💡 You can also run testCORS() to test the fix manually.');
