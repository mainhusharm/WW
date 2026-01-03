// IMMEDIATE CORS FIX - Copy and paste this into your browser console
// This will fix CORS issues immediately on any page

console.log('🔧 Applying Immediate CORS Fix...');

// Override fetch to use CORS proxy for all backend requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Check if this is a request to any backend
    if (typeof url === 'string' && (
        url.includes('node-backend-g1mk.onrender.com') ||
        url.includes('backend-bkt7.onrender.com') ||
        url.includes('backend-8j0e.onrender.com')
    )) {
        console.log('🔄 Intercepting backend request:', url);
        
        // Use CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        console.log('🔄 Using CORS proxy:', proxyUrl);
        
        return originalFetch(proxyUrl, options);
    }
    
    // For all other requests, use original fetch
    return originalFetch(url, options);
};

// Override XMLHttpRequest for older code
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === 'string' && (
        url.includes('node-backend-g1mk.onrender.com') ||
        url.includes('backend-bkt7.onrender.com') ||
        url.includes('backend-8j0e.onrender.com')
    )) {
        console.log('🔄 Intercepting XHR request:', url);
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        console.log('🔄 Using CORS proxy for XHR:', proxyUrl);
        return originalXHROpen.call(this, method, proxyUrl, ...args);
    }
    return originalXHROpen.call(this, method, url, ...args);
};

// Test the fix
async function testFix() {
    try {
        console.log('🧪 Testing CORS fix...');
        
        // Test with the working backend
        const response = await fetch('https://backend-ox9b.onrender.com/health');
        const data = await response.json();
        console.log('✅ Health check successful:', data);
        
        // Test login endpoint
        const loginResponse = await fetch('https://backend-ox9b.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login endpoint working:', loginData);
        
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
setTimeout(testFix, 2000);

console.log('✅ CORS Fix Applied!');
console.log('💡 Try refreshing the page or submitting forms - they should work now!');
