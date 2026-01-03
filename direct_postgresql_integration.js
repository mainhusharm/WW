/**
 * Direct PostgreSQL Integration for Frontend Components
 * This script provides direct database connectivity for testing
 */

// PostgreSQL connection configuration
const POSTGRESQL_CONFIG = {
    host: 'dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com',
    port: 5432,
    database: 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2',
    user: 'pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user',
    password: 'f2Q7RBmy1OeYVDdOvTTDos4TKNe0rd0V',
    ssl: { rejectUnauthorized: false }
};

// Direct database functions
window.DirectPostgreSQL = {
    
    // Save payment data directly to PostgreSQL
    async savePaymentData(paymentData) {
        try {
            console.log('💳 Saving payment data directly to PostgreSQL:', paymentData);
            
            // API call to our working local server
            const response = await fetch('http://localhost:8080/api/simple/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: paymentData.user_id || `user_${Date.now()}`,
                    user_email: paymentData.user_email || 'test@example.com',
                    user_name: paymentData.user_name || 'Test User',
                    plan_name_payment: paymentData.plan_name || 'Pro Plan',
                    original_price: paymentData.original_price || 29.99,
                    discount_amount: paymentData.discount_amount || 0,
                    final_price: paymentData.final_price || 29.99,
                    payment_method: paymentData.payment_method || 'stripe',
                    transaction_id: paymentData.transaction_id || `TXN-${Date.now()}`,
                    payment_status: paymentData.payment_status || 'completed',
                    payment_provider: paymentData.payment_provider || 'Stripe',
                    crypto_transaction_hash: `NON-CRYPTO-${Date.now()}`,
                    crypto_from_address: 'N/A',
                    crypto_amount: '0',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Payment data saved to PostgreSQL:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error saving payment data:', error);
            
            // Fallback: Save to localStorage for now
            const fallbackData = {
                ...paymentData,
                id: `payment_${Date.now()}`,
                saved_at: new Date().toISOString(),
                status: 'saved_locally'
            };
            
            localStorage.setItem(`payment_${Date.now()}`, JSON.stringify(fallbackData));
            console.log('💾 Payment data saved to localStorage as fallback');
            
            return fallbackData;
        }
    },
    
    // Save questionnaire data directly to PostgreSQL
    async saveQuestionnaireData(questionnaireData) {
        try {
            console.log('📋 Saving questionnaire data directly to PostgreSQL:', questionnaireData);
            
            const response = await fetch('http://localhost:8080/api/simple/questionnaire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: questionnaireData.user_id || `user_${Date.now()}`,
                    user_email: questionnaireData.user_email || 'test@example.com',
                    user_name: questionnaireData.user_name || 'Test User',
                    trades_per_day: questionnaireData.trades_per_day || '5-10',
                    trading_session: questionnaireData.trading_session || 'London',
                    crypto_assets: questionnaireData.crypto_assets || ['BTC', 'ETH'],
                    forex_assets: questionnaireData.forex_assets || ['EUR/USD', 'GBP/USD'],
                    has_account: questionnaireData.has_account || 'yes',
                    account_equity: questionnaireData.account_equity || 10000,
                    prop_firm: questionnaireData.prop_firm || 'FTMO',
                    account_type: questionnaireData.account_type || 'Challenge',
                    account_size: questionnaireData.account_size || 10000,
                    risk_percentage: questionnaireData.risk_percentage || 2,
                    risk_reward_ratio: questionnaireData.risk_reward_ratio || '1:2',
                    trading_experience: questionnaireData.trading_experience || 'intermediate',
                    risk_tolerance: questionnaireData.risk_tolerance || 'moderate',
                    trading_goals: questionnaireData.trading_goals || 'Consistent profits',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Questionnaire data saved to PostgreSQL:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error saving questionnaire data:', error);
            
            // Fallback: Save to localStorage
            const fallbackData = {
                ...questionnaireData,
                id: `questionnaire_${Date.now()}`,
                saved_at: new Date().toISOString(),
                status: 'saved_locally'
            };
            
            localStorage.setItem(`questionnaire_${Date.now()}`, JSON.stringify(fallbackData));
            console.log('💾 Questionnaire data saved to localStorage as fallback');
            
            return fallbackData;
        }
    },
    
    // Save dashboard data directly to PostgreSQL
    async saveDashboardData(dashboardData) {
        try {
            console.log('📊 Saving dashboard data directly to PostgreSQL:', dashboardData);
            
            const response = await fetch('http://localhost:8080/api/simple/dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: dashboardData.user_id || `user_${Date.now()}`,
                    user_email: dashboardData.user_email || 'test@example.com',
                    user_name: dashboardData.user_name || 'Test User',
                    current_equity: dashboardData.current_equity || 10000,
                    initial_equity: dashboardData.initial_equity || 10000,
                    total_pnl: dashboardData.total_pnl || 0,
                    win_rate: dashboardData.win_rate || 0,
                    total_trades: dashboardData.total_trades || 0,
                    winning_trades: dashboardData.winning_trades || 0,
                    losing_trades: dashboardData.losing_trades || 0,
                    account_balance: dashboardData.account_balance || 10000,
                    daily_pnl: dashboardData.daily_pnl || 0,
                    last_activity: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Dashboard data saved to PostgreSQL:', result);
            return result;
            
        } catch (error) {
            console.error('❌ Error saving dashboard data:', error);
            
            // Fallback: Save to localStorage
            const fallbackData = {
                ...dashboardData,
                id: `dashboard_${Date.now()}`,
                saved_at: new Date().toISOString(),
                status: 'saved_locally'
            };
            
            localStorage.setItem(`dashboard_${Date.now()}`, JSON.stringify(fallbackData));
            console.log('💾 Dashboard data saved to localStorage as fallback');
            
            return fallbackData;
        }
    },
    
    // Test database connection
    async testConnection() {
        try {
            console.log('🔍 Testing PostgreSQL connection...');
            
            const response = await fetch('http://localhost:8080/api/simple/health');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ PostgreSQL connection successful:', result);
            return true;
            
        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error);
            return false;
        }
    },
    
    // Get all saved data from localStorage (fallback)
    getAllSavedData() {
        const data = {
            payments: [],
            questionnaires: [],
            dashboards: []
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('payment_')) {
                data.payments.push(JSON.parse(localStorage.getItem(key)));
            } else if (key.startsWith('questionnaire_')) {
                data.questionnaires.push(JSON.parse(localStorage.getItem(key)));
            } else if (key.startsWith('dashboard_')) {
                data.dashboards.push(JSON.parse(localStorage.getItem(key)));
            }
        }
        
        return data;
    }
};

// Auto-test connection on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Direct PostgreSQL Integration loaded');
    window.DirectPostgreSQL.testConnection();
});

// Make functions globally available
window.savePaymentData = window.DirectPostgreSQL.savePaymentData;
window.saveQuestionnaireData = window.DirectPostgreSQL.saveQuestionnaireData;
window.saveDashboardData = window.DirectPostgreSQL.saveDashboardData;
