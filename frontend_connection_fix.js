
// Frontend API Connection Fix for signup-enhanced page
// Add this to your signup-enhanced page or update existing API calls

// 1. Update API Base URL
const API_BASE_URL = 'http://localhost:5002';

// 2. Updated signup function
async function submitSignup(formData) {
    try {
        console.log('Submitting signup data:', formData);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        console.log('Signup response:', result);
        
        if (result.success) {
            console.log('✅ Signup successful:', result);
            // Redirect to payment or next page
            window.location.href = '/payment.html';
        } else {
            console.error('❌ Signup failed:', result.error);
            alert('Signup failed: ' + result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Network error:', error);
        alert('Network error: ' + error.message);
        return { success: false, error: error.message };
    }
}

// 3. Example usage - replace your existing form submission
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value,
        country: document.getElementById('country').value,
        password: document.getElementById('password').value,
        terms: document.getElementById('terms').checked,
        newsletter: document.getElementById('newsletter').checked
    };
    
    await submitSignup(formData);
});

// 4. Test connection function
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const result = await response.json();
        console.log('Backend connection test:', result);
        return result.status === 'healthy';
    } catch (error) {
        console.error('Backend connection failed:', error);
        return false;
    }
}

// Test connection on page load
testConnection().then(connected => {
    if (connected) {
        console.log('✅ Backend connected successfully');
    } else {
        console.error('❌ Backend connection failed');
    }
});
