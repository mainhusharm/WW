/**
 * Script to populate localStorage with test users for Customer Service Dashboard
 * 
 * Run this in your browser console on the Customer Service Dashboard page
 * to immediately see test users with different questionnaire data.
 */

function populateTestUsers() {
  console.log('👥 Populating localStorage with test users...');
  
  const testUsers = [
    {
      id: 'test-user-1',
      email: 'conservative.trader@test.com',
      fullName: 'Conservative Trader',
      selectedPlan: { 
        name: 'premium',
        price: 499,
        period: 'monthly',
        description: 'Premium trading signals'
      },
      questionnaireData: {
        hasAccount: 'yes',
        propFirm: 'FTMO',
        accountType: 'Challenge',
        accountSize: 10000,
        riskPercentage: 0.5,
        riskRewardRatio: '2',
        tradingExperience: 'Beginner',
        riskTolerance: 'Low',
        tradingGoals: 'Learn Trading',
        tradesPerDay: '1-2',
        tradingSession: 'London',
        cryptoAssets: ['BTC', 'ETH'],
        forexAssets: ['EURUSD', 'GBPUSD']
      },
      riskManagementPlan: {
        riskPerTrade: 0.5,
        dailyLossLimit: 1.5,
        maxLoss: 500,
        profitTarget: 800,
        tradesToPass: 8,
        riskAmount: 50,
        profitAmount: 100,
        consecutiveLossesLimit: 3,
        generatedAt: new Date().toISOString()
      },
      cryptoAssets: ['BTC', 'ETH'],
      forexPairs: ['EURUSD', 'GBPUSD'],
      otherForexPair: null,
      screenshotUrl: null,
      tradingPreferences: {
        tradingSession: 'London',
        tradesPerDay: '1-2',
        riskTolerance: 'Low',
        tradingExperience: 'Beginner'
      },
      status: 'PENDING',
      planActivatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      trades: []
    },
    {
      id: 'test-user-2',
      email: 'aggressive.trader@test.com',
      fullName: 'Aggressive Trader',
      selectedPlan: { 
        name: 'premium',
        price: 499,
        period: 'monthly',
        description: 'Premium trading signals'
      },
      questionnaireData: {
        hasAccount: 'no',
        propFirm: 'MyForexFunds',
        accountType: 'Evaluation',
        accountSize: 100000,
        riskPercentage: 3.0,
        riskRewardRatio: '3',
        tradingExperience: 'Advanced',
        riskTolerance: 'High',
        tradingGoals: 'Maximum Profits',
        tradesPerDay: '5+',
        tradingSession: 'New York',
        cryptoAssets: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'],
        forexAssets: ['XAUUSD', 'XAGUSD', 'USOIL', 'US30', 'US100']
      },
      riskManagementPlan: {
        riskPerTrade: 3.0,
        dailyLossLimit: 9.0,
        maxLoss: 5000,
        profitTarget: 8000,
        tradesToPass: 4,
        riskAmount: 3000,
        profitAmount: 9000,
        consecutiveLossesLimit: 2,
        generatedAt: new Date().toISOString()
      },
      cryptoAssets: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'],
      forexPairs: ['XAUUSD', 'XAGUSD', 'USOIL', 'US30', 'US100'],
      otherForexPair: null,
      screenshotUrl: null,
      tradingPreferences: {
        tradingSession: 'New York',
        tradesPerDay: '5+',
        riskTolerance: 'High',
        tradingExperience: 'Advanced'
      },
      status: 'PENDING',
      planActivatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      trades: []
    },
    {
      id: 'test-user-3',
      email: 'moderate.trader@test.com',
      fullName: 'Moderate Trader',
      selectedPlan: { 
        name: 'premium',
        price: 499,
        period: 'monthly',
        description: 'Premium trading signals'
      },
      questionnaireData: {
        hasAccount: 'yes',
        propFirm: 'TopStep',
        accountType: 'Instant',
        accountSize: 25000,
        riskPercentage: 1.5,
        riskRewardRatio: '2.5',
        tradingExperience: 'Intermediate',
        riskTolerance: 'Medium',
        tradingGoals: 'Steady Growth',
        tradesPerDay: '2-3',
        tradingSession: 'Asian',
        cryptoAssets: ['BTC', 'ETH', 'LTC'],
        forexAssets: ['USDJPY', 'AUDUSD', 'NZDUSD']
      },
      riskManagementPlan: {
        riskPerTrade: 1.5,
        dailyLossLimit: 4.5,
        maxLoss: 1250,
        profitTarget: 2000,
        tradesToPass: 4,
        riskAmount: 375,
        profitAmount: 938,
        consecutiveLossesLimit: 3,
        generatedAt: new Date().toISOString()
      },
      cryptoAssets: ['BTC', 'ETH', 'LTC'],
      forexPairs: ['USDJPY', 'AUDUSD', 'NZDUSD'],
      otherForexPair: null,
      screenshotUrl: null,
      tradingPreferences: {
        tradingSession: 'Asian',
        tradesPerDay: '2-3',
        riskTolerance: 'Medium',
        tradingExperience: 'Intermediate'
      },
      status: 'PENDING',
      planActivatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payments: [],
      trades: []
    }
  ];
  
  // Save users to localStorage
  localStorage.setItem('users', JSON.stringify(testUsers));
  
  // Also save individual user data for compatibility
  testUsers.forEach(user => {
    localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
    localStorage.setItem(`questionnaire_${user.email}`, JSON.stringify(user.questionnaireData));
    localStorage.setItem(`risk_plan_${user.email}`, JSON.stringify(user.riskManagementPlan));
  });
  
  console.log(`✅ Created ${testUsers.length} test users in localStorage:`);
  testUsers.forEach(user => {
    console.log(`   - ${user.fullName} (${user.email}): ${user.questionnaireData.propFirm}, $${user.questionnaireData.accountSize.toLocaleString()}, ${user.questionnaireData.riskPercentage}% risk`);
  });
  
  console.log('\n🔄 Now refresh the Customer Service Dashboard page to see the users!');
  
  return testUsers;
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🚀 Test User Population Script Loaded');
  console.log('Run populateTestUsers() to create test users in localStorage');
  console.log('Or just run the function directly: populateTestUsers()');
  
  // Auto-run the function
  populateTestUsers();
} else {
  // Export for Node.js
  module.exports = { populateTestUsers };
}
