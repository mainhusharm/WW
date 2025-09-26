/**
 * Fresh Frontend Connection Script
 * Handles all communication between frontend forms and the new backend API
 */

class FreshAPIConnection {
    constructor() {
        // API Configuration - Update these URLs when deployed
        this.API_BASE_URL = this.getApiBaseUrl();
        this.ENDPOINTS = {
            health: '/api/health',
            register: '/api/user/register',
            getUser: '/api/user',
            getAllUsers: '/api/users',
            stats: '/api/stats'
        };
        
        console.log(`🔗 Fresh API Connection initialized with base URL: ${this.API_BASE_URL}`);
    }
    
    getApiBaseUrl() {
        // Determine API base URL based on environment
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:10000';
        } else if (hostname.includes('onrender.com')) {
            return 'https://fresh-backend-api.onrender.com'; // Update with your actual Render URL
        } else {
            // Use your actual backend URL
            return 'https://backend-topb.onrender.com';
        }
    }
    
    async makeRequest(endpoint, options = {}) {
        const url = `${this.API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 15000 // 15 second timeout
        };
        
        const requestOptions = { ...defaultOptions, ...options };
        
        try {
            console.log(`📡 Making request to: ${url}`);
            console.log(`📋 Request options:`, requestOptions);
            
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
            
            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`📨 Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`✅ Response data:`, data);
            
            return data;
            
        } catch (error) {
            console.error(`❌ Request failed for ${url}:`, error);
            throw error;
        }
    }
    
    async healthCheck() {
        try {
            const response = await this.makeRequest(this.ENDPOINTS.health);
            return response;
        } catch (error) {
            console.error('❌ Health check failed:', error);
            return { status: 'unhealthy', error: error.message };
        }
    }
    
    async registerUser(userData) {
        try {
            console.log('🚀 Registering user with data:', userData);
            
            const response = await this.makeRequest(this.ENDPOINTS.register, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                console.log('✅ User registered successfully:', response);
                
                // Store user data in localStorage
                const userInfo = {
                    user_id: response.user_id,
                    access_token: response.access_token,
                    user: response.user,
                    registrationTime: new Date().toISOString()
                };
                
                localStorage.setItem('fresh_user_data', JSON.stringify(userInfo));
                localStorage.setItem('fresh_access_token', response.access_token);
                localStorage.setItem('fresh_user_id', response.user_id);
                
                return response;
            } else {
                throw new Error(response.error || 'Registration failed');
            }
            
        } catch (error) {
            console.error('❌ Registration failed:', error);
            throw error;
        }
    }
    
    async getUser(userId) {
        try {
            const response = await this.makeRequest(`${this.ENDPOINTS.getUser}/${userId}`);
            return response;
        } catch (error) {
            console.error('❌ Get user failed:', error);
            throw error;
        }
    }
    
    async getAllUsers() {
        try {
            const response = await this.makeRequest(this.ENDPOINTS.getAllUsers);
            return response;
        } catch (error) {
            console.error('❌ Get all users failed:', error);
            throw error;
        }
    }
    
    async getStats() {
        try {
            const response = await this.makeRequest(this.ENDPOINTS.stats);
            return response;
        } catch (error) {
            console.error('❌ Get stats failed:', error);
            throw error;
        }
    }
    
    // Helper method to extract form data
    extractFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key === 'terms' || key === 'newsletter') {
                data[key] = value === 'on';
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
    
    // Helper method to validate required fields
    validateRequiredFields(data, requiredFields) {
        const missing = [];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].toString().trim() === '') {
                missing.push(field);
            }
        }
        
        return missing;
    }
    
    // Method to show success message
    showSuccessMessage(container, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.style.cssText = `
            background: rgba(100, 255, 150, 0.2);
            border: 1px solid rgba(100, 255, 150, 0.3);
            color: rgba(150, 255, 180, 0.9);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 500;
        `;
        messageDiv.textContent = message;
        
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    // Method to show error message
    showErrorMessage(container, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.style.cssText = `
            background: rgba(255, 100, 100, 0.2);
            border: 1px solid rgba(255, 100, 100, 0.3);
            color: rgba(255, 150, 150, 0.9);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 500;
        `;
        messageDiv.textContent = message;
        
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 10000);
    }
}

// Initialize global API connection
const freshAPI = new FreshAPIConnection();

// Form handler for signup forms
function initializeFreshSignupForm(formId = 'signup-form') {
    const form = document.getElementById(formId);
    if (!form) {
        console.warn(`⚠️ Signup form with ID '${formId}' not found`);
        return;
    }
    
    console.log(`🎯 Initializing fresh signup form: ${formId}`);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        
        try {
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
            
            // Extract form data
            const formData = freshAPI.extractFormData(form);
            console.log('📝 Form data extracted:', formData);
            
            // Validate required fields
            const requiredFields = ['firstName', 'lastName', 'email', 'password'];
            const missing = freshAPI.validateRequiredFields(formData, requiredFields);
            
            if (missing.length > 0) {
                throw new Error(`Please fill in all required fields: ${missing.join(', ')}`);
            }
            
            // Check terms agreement
            if (!formData.terms) {
                throw new Error('Please accept the Terms of Service and Privacy Policy');
            }
            
            // Register user
            const result = await freshAPI.registerUser(formData);
            
            // Show success message
            freshAPI.showSuccessMessage(form.parentElement, 
                '✅ Account created successfully! Redirecting to payment...');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/payment.html';
            }, 2000);
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            
            // Show error message
            let errorMessage = error.message;
            if (error.message.includes('409')) {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            }
            
            freshAPI.showErrorMessage(form.parentElement, `❌ ${errorMessage}`);
            
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Fresh Frontend Connection loaded');
    
    // Test API connection
    freshAPI.healthCheck().then(result => {
        console.log('🏥 API Health Check:', result);
    });
    
    // Auto-initialize common signup form IDs
    const commonFormIds = ['signup-form', 'signupForm', 'registration-form'];
    commonFormIds.forEach(id => {
        if (document.getElementById(id)) {
            initializeFreshSignupForm(id);
        }
    });
});

// Export for use in other scripts
window.freshAPI = freshAPI;
window.initializeFreshSignupForm = initializeFreshSignupForm;
