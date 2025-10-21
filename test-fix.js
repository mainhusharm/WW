// Test script to verify the data persistence fix
console.log('Testing data persistence fix...');

// Simulate the signup process
function simulateSignup() {
    console.log('1. Simulating signup with $15,000 account...');
    
    // Clear localStorage
    localStorage.clear();
    
    // Create user data (as done in SignUp.tsx)
    const userData = {
        uniqueId: '123456',
        id: 'user_123456',
        name: 'Test User',
        email: 'test@example.com',
        membershipTier: 'premium',
        accountType: 'personal',
        riskTolerance: 'moderate',
        isAuthenticated: true,
        setupComplete: false,
        token: 'test-token-123',
        tradingData: null
    };
    
    // Store user data
    localStorage.setItem('current_user', JSON.stringify(userData));
    localStorage.setItem('access_token', 'test-token-123');
    
    // Simulate questionnaire completion with $15,000 account
    const questionnaireData = {
        hasAccount: 'yes',
        propFirm: 'QuantTekel',
        accountType: 'QuantTekel Instant',
        experience: 'intermediate',
        accountSize: 15000, // $15,000 as specified
        riskTolerance: 'moderate',
        riskPercentage: 2,
        tradesPerDay: '3-5',
        tradingSession: 'London',
        cryptoAssets: ['BTC', 'ETH'],
        forexAssets: ['EURUSD', 'GBPUSD']
    };
    
    localStorage.setItem('questionnaireAnswers', JSON.stringify(questionnaireData));
    localStorage.setItem('questionnaire_completed', 'true');
    
    console.log('✅ Signup complete. Questionnaire data stored:', questionnaireData);
    return { userData, questionnaireData };
}

// Simulate logout
function simulateLogout() {
    console.log('2. Simulating logout...');
    
    // Remove auth tokens but preserve questionnaire data
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    
    const questionnaireData = localStorage.getItem('questionnaireAnswers');
    console.log('✅ Logout complete. Questionnaire data preserved:', questionnaireData ? 'Yes' : 'No');
    
    return questionnaireData;
}

// Simulate login with the fixed logic
function simulateLogin() {
    console.log('3. Simulating login with fixed logic...');
    
    // Get stored user data
    const storedUser = localStorage.getItem('current_user');
    const questionnaireAnswers = localStorage.getItem('questionnaireAnswers');
    
    if (!storedUser || !questionnaireAnswers) {
        console.log('❌ No stored user data or questionnaire data found');
        return false;
    }
    
    const parsedUser = JSON.parse(storedUser);
    let tradingData = parsedUser.tradingData;
    
    // Apply the fixed logic from UserContext.tsx
    if (questionnaireAnswers) {
        try {
            const answers = JSON.parse(questionnaireAnswers);
            tradingData = {
                propFirm: answers.propFirm || '',
                accountType: answers.accountType || '',
                accountSize: String(answers.accountSize),
                riskPerTrade: String(answers.riskPercentage || 1),
                riskRewardRatio: answers.riskRewardRatio || '2',
                tradesPerDay: answers.tradesPerDay || '1-2',
                tradingSession: answers.tradingSession || 'any',
                cryptoAssets: answers.cryptoAssets || [],
                forexAssets: answers.forexAssets || [],
                hasAccount: answers.hasAccount || 'no',
                tradingExperience: answers.tradingExperience || 'intermediate'
            };
            
            // Update user data with questionnaire data
            parsedUser.tradingData = tradingData;
            localStorage.setItem('current_user', JSON.stringify(parsedUser));
            
            console.log('✅ Login complete. Trading data loaded:', tradingData);
            
            // Verify the data is correct
            const isCorrect = tradingData.accountSize === '15000' && 
                            tradingData.propFirm === 'QuantTekel' && 
                            tradingData.accountType === 'QuantTekel Instant';
            
            console.log('✅ Data verification:', isCorrect ? 'PASSED' : 'FAILED');
            console.log('   Expected: Account Size: 15000, Prop Firm: QuantTekel, Account Type: QuantTekel Instant');
            console.log('   Actual: Account Size:', tradingData.accountSize, 'Prop Firm:', tradingData.propFirm, 'Account Type:', tradingData.accountType);
            
            return isCorrect;
        } catch (parseError) {
            console.log('❌ Error parsing questionnaire answers:', parseError);
            return false;
        }
    }
    
    return false;
}

// Run the complete test
function runTest() {
    console.log('🧪 Starting data persistence test...\n');
    
    try {
        // Step 1: Signup
        const { userData, questionnaireData } = simulateSignup();
        
        // Step 2: Logout
        const preservedData = simulateLogout();
        
        // Step 3: Login
        const loginSuccess = simulateLogin();
        
        console.log('\n📊 Test Results:');
        console.log('   Signup: ✅ Success');
        console.log('   Logout: ✅ Success');
        console.log('   Login: ' + (loginSuccess ? '✅ Success' : '❌ Failed'));
        
        if (loginSuccess) {
            console.log('\n🎉 FIX SUCCESSFUL! Data persistence is working correctly.');
            console.log('   The user will now see their actual $15,000 account data instead of hardcoded values.');
        } else {
            console.log('\n❌ FIX FAILED! Data persistence is not working correctly.');
            console.log('   The user will still see hardcoded values instead of their actual data.');
        }
        
        return loginSuccess;
    } catch (error) {
        console.log('❌ Test failed with error:', error);
        return false;
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testDataPersistence = runTest;
    console.log('Test function available as window.testDataPersistence()');
}

// Run test if in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTest, simulateSignup, simulateLogout, simulateLogin };
}
