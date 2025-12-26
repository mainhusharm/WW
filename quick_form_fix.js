// Quick Form Fix for signup-enhanced page
// Add this script to your signup page to immediately fix form data capture

console.log('🚀 Quick Form Fix Applied');

// 1. Fix form field IDs if missing
document.querySelectorAll('input, select, textarea').forEach((field, index) => {
    if (!field.id && field.name) {
        field.id = field.name;
    } else if (!field.id) {
        field.id = `field_${index}`;
    }
});

// 2. Enhanced form submission with detailed logging
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🚀 FORM SUBMITTED!');
        
        // Capture all form data with detailed logging
        const formData = {};
        const inputs = this.querySelectorAll('input, select, textarea');
        
        console.log(`📋 Processing ${inputs.length} form fields:`);
        inputs.forEach((input, i) => {
            let value = '';
            
            if (input.type === 'checkbox' || input.type === 'radio') {
                value = input.checked;
            } else {
                value = input.value || '';
            }
            
            const key = input.id || input.name || `field_${i}`;
            formData[key] = value;
            
            console.log(`  ${i+1}. ${key}: ${value} (${input.type})`);
        });
        
        console.log('📤 Final form data:', formData);
        
        // Validate required fields
        const required = ['firstName', 'lastName', 'email'];
        const missing = required.filter(field => !formData[field]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required fields:', missing);
            alert(`Please fill in: ${missing.join(', ')}`);
            return;
        }
        
        // Prepare API data
        const apiData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || '',
            company: formData.company || '',
            country: formData.country || '',
            password: formData.password || '',
            terms: formData.terms === 'on' || formData.terms === true,
            newsletter: formData.newsletter === 'on' || formData.newsletter === true
        };
        
        console.log('📤 Sending to API:', apiData);
        
        try {
            const response = await fetch('http://localhost:5002/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });
            
            const result = await response.json();
            console.log('📥 API Response:', result);
            
            if (result.success) {
                console.log('✅ SIGNUP SUCCESS!');
                alert('Signup successful! Data saved to database.');
                // Optional: redirect to next page
                // window.location.href = '/payment.html';
            } else {
                console.error('❌ SIGNUP FAILED:', result.error);
                alert('Signup failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('❌ NETWORK ERROR:', error);
            alert('Network error: ' + error.message);
        }
    });
});

// 3. Add visual debugging indicators
const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
submitButtons.forEach(button => {
    button.style.border = '3px solid #ff0000';
    button.addEventListener('click', () => {
        console.log('🔴 Submit button clicked!');
    });
});

// 4. Add test button for manual testing
const testButton = document.createElement('button');
testButton.textContent = '🧪 Test Form Data';
testButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ff0000;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
`;
testButton.addEventListener('click', () => {
    console.log('🧪 MANUAL TEST TRIGGERED');
    
    const form = document.querySelector('form');
    if (!form) {
        console.error('❌ No form found!');
        return;
    }
    
    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, i) => {
        let value = '';
        if (input.type === 'checkbox' || input.type === 'radio') {
            value = input.checked;
        } else {
            value = input.value || '';
        }
        
        const key = input.id || input.name || `field_${i}`;
        formData[key] = value;
    });
    
    console.log('📋 Current form data:', formData);
    alert('Check console for form data details!');
});

document.body.appendChild(testButton);

console.log('✅ Quick Form Fix Applied!');
console.log('💡 Try filling the form and clicking submit to test data capture');
