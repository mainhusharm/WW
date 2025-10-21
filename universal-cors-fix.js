/**
 * Universal CORS Fix Script
 * This script fixes CORS issues across the entire application
 * Run this in the browser console on any page of your application
 */

console.log('🔧 Starting Universal CORS Fix...');

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

// Test the fix with multiple endpoints
async function testCORSFix() {
    const endpoints = [
        '/health',
        '/api/users',
        '/api/auth/register'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🧪 Testing endpoint: ${endpoint}`);
            const response = await fetch(`${BACKEND_URL}${endpoint}`);
            const data = await response.json();
            
            if (response.ok) {
                console.log(`✅ ${endpoint} - Success`);
                results.push({ endpoint, status: 'success', data });
            } else {
                console.log(`❌ ${endpoint} - Failed: ${response.status}`);
                results.push({ endpoint, status: 'failed', error: response.status });
            }
        } catch (error) {
            console.log(`❌ ${endpoint} - Error: ${error.message}`);
            results.push({ endpoint, status: 'error', error: error.message });
        }
    }
    
    return results;
}

// Show success message
function showSuccessMessage() {
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
        <div style="font-weight: bold; margin-bottom: 8px;">✅ Universal CORS Fix Applied!</div>
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
}

// Run comprehensive test
async function runComprehensiveTest() {
    console.log('🧪 Running comprehensive CORS test...');
    const results = await testCORSFix();
    
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    if (successCount === totalCount) {
        console.log('✅ All endpoints working! CORS fix successful.');
        showSuccessMessage();
    } else {
        console.log(`⚠️ ${successCount}/${totalCount} endpoints working. Some issues may remain.`);
    }
    
    return results;
}

// Provide manual test function
window.testCORS = runComprehensiveTest;

// Run test after a short delay
setTimeout(runComprehensiveTest, 2000);

console.log('✅ Universal CORS Fix Applied!');
console.log('💡 You can run testCORS() to test all endpoints manually.');
console.log('🔄 Try refreshing the page or submitting forms - they should work now!');
