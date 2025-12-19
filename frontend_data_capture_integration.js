/**
 * Frontend Data Capture Integration
 * Automatically captures data from payment-enhanced, questionnaire, and dashboard
 * and sends it to the enhanced data capture system
 */

// Enhanced Data Capture Service
class EnhancedDataCaptureService {
    constructor() {
        // Use the appropriate base URL based on environment
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:5003/api/data-capture'
            : 'https://traderedgepro.com/api/data-capture';
        this.isEnabled = true;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    // Capture payment data
    async capturePaymentData(paymentData) {
        if (!this.isEnabled) return null;

        try {
            console.log('🔄 Capturing payment data:', paymentData);
            
            // Enhance payment data with user info
            const user = this.getCurrentUser();
            const enhancedData = {
                ...paymentData,
                user_email: user?.email || paymentData.user_email || paymentData.email,
                user_name: user?.fullName || user?.username || paymentData.user_name,
                capture_timestamp: new Date().toISOString(),
                source: 'payment-enhanced'
            };

            const response = await this.sendWithRetry('/payment', enhancedData);
            
            if (response && response.success) {
                console.log('✅ Payment data captured successfully:', response);
                this.logCaptureEvent('payment', 'success', enhancedData.user_email);
                return response;
            } else {
                console.warn('⚠️ Payment data capture failed:', response);
                this.logCaptureEvent('payment', 'failed', enhancedData.user_email);
                return null;
            }
        } catch (error) {
            console.error('❌ Error capturing payment data:', error);
            this.logCaptureEvent('payment', 'error', paymentData.user_email || paymentData.email);
            return null;
        }
    }

    // Capture questionnaire data
    async captureQuestionnaireData(questionnaireData) {
        if (!this.isEnabled) return null;

        try {
            console.log('🔄 Capturing questionnaire data:', questionnaireData);
            
            // Enhance questionnaire data with user info
            const user = this.getCurrentUser();
            const enhancedData = {
                ...questionnaireData,
                user_email: user?.email || questionnaireData.user_email || questionnaireData.email,
                user_name: user?.fullName || user?.username || questionnaireData.user_name,
                capture_timestamp: new Date().toISOString(),
                source: 'questionnaire'
            };

            const response = await this.sendWithRetry('/questionnaire', enhancedData);
            
            if (response && response.success) {
                console.log('✅ Questionnaire data captured successfully:', response);
                this.logCaptureEvent('questionnaire', 'success', enhancedData.user_email);
                return response;
            } else {
                console.warn('⚠️ Questionnaire data capture failed:', response);
                this.logCaptureEvent('questionnaire', 'failed', enhancedData.user_email);
                return null;
            }
        } catch (error) {
            console.error('❌ Error capturing questionnaire data:', error);
            this.logCaptureEvent('questionnaire', 'error', questionnaireData.user_email || questionnaireData.email);
            return null;
        }
    }

    // Capture dashboard data
    async captureDashboardData(dashboardData, tradingState, theme = 'dark') {
        if (!this.isEnabled) return null;

        try {
            console.log('🔄 Capturing dashboard data');
            
            // Enhance dashboard data with user info
            const user = this.getCurrentUser();
            const enhancedData = {
                dashboardData: dashboardData || {},
                tradingState: tradingState || {},
                theme: theme,
                user_email: user?.email,
                user_name: user?.fullName || user?.username,
                capture_timestamp: new Date().toISOString(),
                source: 'dashboard'
            };

            const response = await this.sendWithRetry('/dashboard', enhancedData);
            
            if (response && response.success) {
                console.log('✅ Dashboard data captured successfully:', response);
                this.logCaptureEvent('dashboard', 'success', enhancedData.user_email);
                return response;
            } else {
                console.warn('⚠️ Dashboard data capture failed:', response);
                this.logCaptureEvent('dashboard', 'failed', enhancedData.user_email);
                return null;
            }
        } catch (error) {
            console.error('❌ Error capturing dashboard data:', error);
            this.logCaptureEvent('dashboard', 'error', user?.email);
            return null;
        }
    }

    // Capture trading activity
    async captureTradingActivity(activityType, activityData) {
        if (!this.isEnabled) return null;

        try {
            const user = this.getCurrentUser();
            const enhancedData = {
                user_email: user?.email,
                activity_type: activityType,
                activity_data: activityData,
                timestamp: new Date().toISOString()
            };

            const response = await this.sendWithRetry('/activity', enhancedData);
            
            if (response && response.success) {
                console.log('✅ Trading activity captured:', activityType);
                return response;
            }
        } catch (error) {
            console.error('❌ Error capturing trading activity:', error);
            return null;
        }
    }

    // Send data with retry logic
    async sendWithRetry(endpoint, data, attempt = 1) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.retryAttempts) {
                console.log(`Retrying in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return this.sendWithRetry(endpoint, data, attempt + 1);
            } else {
                console.error(`All ${this.retryAttempts} attempts failed for ${endpoint}`);
                throw error;
            }
        }
    }

    // Get current user from various sources
    getCurrentUser() {
        try {
            // Try to get user from localStorage
            const userData = localStorage.getItem('user_data');
            if (userData) {
                return JSON.parse(userData);
            }

            // Try to get user from sessionStorage
            const sessionUser = sessionStorage.getItem('currentUser');
            if (sessionUser) {
                return JSON.parse(sessionUser);
            }

            // Try React context or global user object
            if (window.currentUser) {
                return window.currentUser;
            }

            return null;
        } catch (error) {
            console.warn('Could not get current user:', error);
            return null;
        }
    }

    // Log capture events
    logCaptureEvent(type, status, userEmail) {
        try {
            const events = JSON.parse(localStorage.getItem('dataCapture_events') || '[]');
            events.push({
                type,
                status,
                userEmail,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 100 events
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            localStorage.setItem('dataCapture_events', JSON.stringify(events));
        } catch (error) {
            console.warn('Could not log capture event:', error);
        }
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get user data statistics
    async getUserStats(userEmail) {
        try {
            const response = await fetch(`${this.baseURL}/stats/${userEmail}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Health check failed:', error);
            return null;
        }
    }

    // Enable/disable data capture
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`Data capture ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Create global instance
const enhancedDataCapture = new EnhancedDataCaptureService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = enhancedDataCapture;
}

// Make available globally
window.enhancedDataCapture = enhancedDataCapture;

// Integration with existing payment flow
(function() {
    // Override existing savePaymentToSupabase function
    const originalSavePaymentToSupabase = window.savePaymentToSupabase;
    window.savePaymentToSupabase = async function(paymentData) {
        // Call original function first
        let result = null;
        if (originalSavePaymentToSupabase && typeof originalSavePaymentToSupabase === 'function') {
            result = await originalSavePaymentToSupabase(paymentData);
        }

        // Then capture with enhanced system
        enhancedDataCapture.capturePaymentData(paymentData);
        
        return result;
    };

    // Override existing storeQuestionnaireData function
    const originalStoreQuestionnaireData = window.storeQuestionnaireData;
    window.storeQuestionnaireData = function(questionnaireData) {
        // Call original function first
        if (originalStoreQuestionnaireData && typeof originalStoreQuestionnaireData === 'function') {
            originalStoreQuestionnaireData(questionnaireData);
        }

        // Then capture with enhanced system
        enhancedDataCapture.captureQuestionnaireData(questionnaireData);
    };

    // Override existing saveDashboardToSupabase function
    const originalSaveDashboardToSupabase = window.saveDashboardToSupabase;
    window.saveDashboardToSupabase = async function(dashboardData, tradingState, theme) {
        // Call original function first
        let result = null;
        if (originalSaveDashboardToSupabase && typeof originalSaveDashboardToSupabase === 'function') {
            result = await originalSaveDashboardToSupabase(dashboardData, tradingState, theme);
        }

        // Then capture with enhanced system
        enhancedDataCapture.captureDashboardData(dashboardData, tradingState, theme);
        
        return result;
    };
})();

// Auto-capture on form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Capture payment form submissions
    const paymentForms = document.querySelectorAll('form[id*="payment"], form[class*="payment"]');
    paymentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const formData = new FormData(form);
            const paymentData = Object.fromEntries(formData.entries());
            enhancedDataCapture.capturePaymentData(paymentData);
        });
    });

    // Capture questionnaire form submissions
    const questionnaireForms = document.querySelectorAll('form[id*="questionnaire"], form[class*="questionnaire"]');
    questionnaireForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const formData = new FormData(form);
            const questionnaireData = Object.fromEntries(formData.entries());
            enhancedDataCapture.captureQuestionnaireData(questionnaireData);
        });
    });
});

// Auto-capture localStorage changes (for dashboard state)
(function() {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        
        // Capture dashboard-related data changes
        if (key.includes('trading_state') || key.includes('dashboard_data')) {
            try {
                const data = JSON.parse(value);
                const user = enhancedDataCapture.getCurrentUser();
                if (user && user.email) {
                    if (key.includes('trading_state')) {
                        enhancedDataCapture.captureDashboardData(null, data);
                    } else if (key.includes('dashboard_data')) {
                        enhancedDataCapture.captureDashboardData(data, null);
                    }
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }
    };
})();

console.log('✅ Enhanced Data Capture Integration loaded');
console.log('🔄 Auto-capturing payment, questionnaire, and dashboard data');

// Export the service
export default enhancedDataCapture;
