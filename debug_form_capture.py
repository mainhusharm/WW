#!/usr/bin/env python3
"""
Debug Frontend Form Data Capture
Analyzes and fixes form data capture issues in signup-enhanced page
"""

import os
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_form_debugger():
    """Create a comprehensive form debugger for the signup page"""
    logger.info("🔧 Creating form debugger...")
    
    form_debugger = '''
// Comprehensive Form Debugger for signup-enhanced page
// Add this to your signup page to debug form data capture

console.log('🚀 Form Debugger Loaded');

// 1. Debug all form elements
function debugFormElements() {
    console.log('📋 FORM ELEMENTS DEBUG:');
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        console.log(`Form ${index}:`, form);
        console.log(`Form ID: ${form.id}`);
        console.log(`Form Action: ${form.action}`);
        console.log(`Form Method: ${form.method}`);
        
        const inputs = form.querySelectorAll('input, select, textarea');
        console.log(`Found ${inputs.length} form fields:`);
        inputs.forEach((input, i) => {
            console.log(`  ${i+1}. ${input.type || input.tagName} - ID: ${input.id}, Name: ${input.name}, Value: ${input.value}`);
        });
    });
}

// 2. Enhanced form data capture with debugging
function captureFormData(formElement) {
    console.log('📤 CAPTURING FORM DATA...');
    
    const formData = {};
    const inputs = formElement.querySelectorAll('input, select, textarea');
    
    console.log(`Processing ${inputs.length} form fields...`);
    
    inputs.forEach((input, index) => {
        let value = '';
        
        // Handle different input types
        if (input.type === 'checkbox' || input.type === 'radio') {
            value = input.checked;
            console.log(`  ${index+1}. ${input.type} - ${input.id || input.name}: ${value}`);
        } else if (input.type === 'select-one' || input.type === 'select-multiple') {
            value = input.value;
            console.log(`  ${index+1}. ${input.type} - ${input.id || input.name}: ${value}`);
        } else {
            value = input.value || '';
            console.log(`  ${index+1}. ${input.type || input.tagName} - ${input.id || input.name}: ${value}`);
        }
        
        // Use either ID or Name as key
        const key = input.id || input.name || `field_${index}`;
        formData[key] = value;
    });
    
    console.log('✅ Form data captured:', formData);
    return formData;
}

// 3. Universal form submission handler
function handleFormSubmission(formSelector = 'form') {
    console.log('🔧 Setting up form submission handler...');
    
    const forms = document.querySelectorAll(formSelector);
    
    forms.forEach((form, index) => {
        console.log(`Setting up handler for form ${index}:`, form);
        
        // Remove existing event listeners
        form.removeEventListener('submit', handleSubmit);
        
        // Add new event listener
        form.addEventListener('submit', handleSubmit);
        
        // Also handle button clicks for forms without submit buttons
        const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
        submitButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Submit button clicked:', button);
                // Small delay to ensure form data is captured
                setTimeout(() => handleSubmit(e), 10);
            });
        });
    });
}

// 4. Main submit handler
async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🚀 FORM SUBMIT HANDLER TRIGGERED');
    console.log('Event:', event);
    console.log('Target form:', event.target);
    
    const form = event.target;
    const formData = captureFormData(form);
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
    }
    
    // Prepare data for API
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
                'Accept': 'application/json'
            },
            body: JSON.stringify(apiData)
        });
        
        const result = await response.json();
        console.log('📥 API Response:', result);
        
        if (result.success) {
            console.log('✅ SIGNUP SUCCESSFUL!');
            alert('Signup successful! Redirecting...');
            // Redirect to payment page
            window.location.href = '/payment.html';
        } else {
            console.error('❌ SIGNUP FAILED:', result.error);
            alert('Signup failed: ' + result.error);
        }
        
    } catch (error) {
        console.error('❌ NETWORK ERROR:', error);
        alert('Network error: ' + error.message);
    }
}

// 5. Auto-detect and fix common form issues
function fixCommonFormIssues() {
    console.log('🔧 FIXING COMMON FORM ISSUES...');
    
    // Fix 1: Add IDs to form fields that don't have them
    const inputs = document.querySelectorAll('input:not([id]), select:not([id]), textarea:not([id])');
    inputs.forEach((input, index) => {
        if (!input.id && input.name) {
            input.id = input.name;
            console.log(`Added ID "${input.name}" to field`);
        } else if (!input.id) {
            input.id = `field_${index}`;
            console.log(`Added ID "${input.id}" to unnamed field`);
        }
    });
    
    // Fix 2: Ensure form has proper structure
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        if (!form.id) {
            form.id = `signupForm_${index}`;
            console.log(`Added ID "${form.id}" to form`);
        }
    });
    
    // Fix 3: Add visual feedback for debugging
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitButtons.forEach(button => {
        button.style.border = '2px solid red'; // Visual indicator
        button.addEventListener('click', () => {
            console.log('🔴 Submit button clicked');
        });
    });
}

// 6. Initialize everything when page loads
function initializeFormDebugger() {
    console.log('🚀 INITIALIZING FORM DEBUGGER...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startDebugging, 100);
        });
    } else {
        setTimeout(startDebugging, 100);
    }
}

function startDebugging() {
    console.log('🎯 STARTING FORM DEBUGGING...');
    
    // Step 1: Debug existing elements
    debugFormElements();
    
    // Step 2: Fix common issues
    fixCommonFormIssues();
    
    // Step 3: Set up form handlers
    handleFormSubmission();
    
    // Step 4: Add test button
    addTestButton();
    
    console.log('✅ FORM DEBUGGER INITIALIZED');
    console.log('💡 Try filling the form and clicking submit to see detailed logs');
}

function addTestButton() {
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Form Capture';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: red;
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
        if (form) {
            captureFormData(form);
        } else {
            console.error('❌ No form found to test');
        }
    });
    
    document.body.appendChild(testButton);
    console.log('🧪 Test button added to page');
}

// 7. Start the debugger
initializeFormDebugger();
'''
    
    # Save the debugger
    with open('form_debugger.js', 'w') as f:
        f.write(form_debugger)
    
    logger.info("✅ Form debugger created: form_debugger.js")
    return True

def create_simple_form_tester():
    """Create a simple standalone form tester"""
    logger.info("🔧 Creating simple form tester...")
    
    tester_html = '''
<!DOCTYPE html>
<html>
<head>
    <title>Signup Form Tester</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-group { margin: 10px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .debug { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <h1>Signup Form Tester</h1>
    <div class="debug" id="debugOutput">Debug output will appear here...</div>
    
    <form id="testForm">
        <div class="form-group">
            <label for="firstName">First Name *</label>
            <input type="text" id="firstName" name="firstName" required>
        </div>
        
        <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input type="text" id="lastName" name="lastName" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" id="phone" name="phone">
        </div>
        
        <div class="form-group">
            <label for="company">Company</label>
            <input type="text" id="company" name="company">
        </div>
        
        <div class="form-group">
            <label for="country">Country</label>
            <select id="country" name="country">
                <option value="">Select Country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="password">Password *</label>
            <input type="password" id="password" name="password" required>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="terms" name="terms"> I agree to terms and conditions *
            </label>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" id="newsletter" name="newsletter"> Subscribe to newsletter
            </label>
        </div>
        
        <button type="submit">Submit Signup</button>
        <button type="button" onclick="testFormCapture()">Test Capture</button>
    </form>

    <script>
        // Simple form capture test
        function testFormCapture() {
            const form = document.getElementById('testForm');
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            console.log('Form Data Captured:', data);
            document.getElementById('debugOutput').textContent = 
                'Captured: ' + JSON.stringify(data, null, 2);
            
            // Test API call
            fetch('http://localhost:5002/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                console.log('API Response:', result);
                document.getElementById('debugOutput').textContent += 
                    '\n\nAPI Response: ' + JSON.stringify(result, null, 2);
            })
            .catch(error => {
                console.error('API Error:', error);
                document.getElementById('debugOutput').textContent += 
                    '\n\nAPI Error: ' + error.message;
            });
        }
        
        // Form submission handler
        document.getElementById('testForm').addEventListener('submit', function(e) {
            e.preventDefault();
            testFormCapture();
        });
    </script>
</body>
</html>
'''
    
    # Save the tester
    with open('form_tester.html', 'w') as f:
        f.write(tester_html)
    
    logger.info("✅ Simple form tester created: form_tester.html")
    return True

def main():
    """Main function to create debugging tools"""
    logger.info("🚀 Creating Frontend Form Debugging Tools")
    logger.info("=" * 50)
    
    # Create form debugger
    debugger_created = create_form_debugger()
    
    # Create simple form tester
    tester_created = create_simple_form_tester()
    
    logger.info("\n📊 DEBUGGING TOOLS CREATED")
    logger.info("=" * 30)
    logger.info(f"Form Debugger: {'✅' if debugger_created else '❌'}")
    logger.info(f"Form Tester: {'✅' if tester_created else '❌'}")
    
    logger.info("\n🔧 HOW TO USE:")
    logger.info("1. Add form_debugger.js to your signup-enhanced page")
    logger.info("2. Open browser console and check for detailed logs")
    logger.info("3. Try form_tester.html for a working test form")
    logger.info("4. Use the test button to see form data capture in action")
    
    logger.info("\n🎯 NEXT STEPS:")
    logger.info("1. Open form_tester.html in browser to test basic functionality")
    logger.info("2. Add the debugger script to your actual signup page")
    logger.info("3. Check browser console for detailed form capture logs")
    logger.info("4. Fix any form field ID/name mismatches")

if __name__ == "__main__":
    main()
