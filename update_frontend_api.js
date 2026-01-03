// Update Frontend API Configuration
// Run this in your browser console or update your frontend code

// Option 1: If using environmentUtils.ts, update it to:
const API_BASE_URL = 'http://localhost:5002';

// Option 2: If using direct fetch calls, update them to:
fetch('http://localhost:5002/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User', 
        email: 'test@example.com',
        phone: '123456789',
        company: 'Test Company',
        country: 'United States',
        password: 'test123',
        terms: true,
        newsletter: false
    })
})
.then(response => response.json())
.then(data => {
    console.log('Signup Success:', data);
})
.catch(error => {
    console.error('Signup Error:', error);
});

// Option 3: Update your signup-enhanced page API URL
// Change any API calls from localhost:5000 or localhost:5001 to localhost:5002
