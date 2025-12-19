/**
 * Fix CORS Issues Now - Universal Script
 * This script fixes CORS issues across your entire application
 * Run this in the browser console on any page with CORS errors
 */

console.log('🔧 Applying CORS Fix Now...');

// Configuration
const BACKEND_URL = 'https://node-backend-g1mk.onrender.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Store original functions
const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;

// Override fetch to use CORS proxy for all backend requests
window.fetch = function(url, options = {}) {
    // Check if this is a request to our backend
    if (typeof url === 'string' && url.includes('node-backend-g1mk.onrender.com')) {
        console.log('🔄 Intercepting fetch request:', url);
        
        // Use CORS proxy
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
        console.log('🔄 Using CORS proxy:', proxyUrl);
        
        return originalFetch(proxyUrl, options);
    }
    
    // For all other requests, use original fetch
    return originalFetch(url, options);
};

// Override XMLHttpRequest for older code
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
        
        // Test health endpoint
        const healthResponse = await fetch(`${BACKEND_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health endpoint:', healthData);
        
        // Test users endpoint
        const usersResponse = await fetch(`${BACKEND_URL}/api/users`);
        const usersData = await usersResponse.json();
        console.log('✅ Users endpoint:', usersData);
        
        // Show success message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            border-left: 4px solid #28a745;
            max-width: 300px;
        `;
        message.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">✅ CORS Fix Applied!</div>
            <div>All backend requests now work through CORS proxy.</div>
            <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
                Try refreshing the page or submitting forms again.
            </div>
        `;
        document.body.appendChild(message);
        
        // Remove message after 8 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 8000);
        
        return true;
    } catch (error) {
        console.error('❌ CORS fix test failed:', error);
        return false;
    }
}

// Run test after a short delay
setTimeout(testCORSFix, 2000);

// Provide manual test function
window.testCORS = testCORSFix;

console.log('✅ CORS Fix Applied!');
console.log('💡 You can run testCORS() to test the fix manually.');
console.log('🔄 Try refreshing the page or submitting forms - they should work now!');
