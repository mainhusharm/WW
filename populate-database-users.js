/**
 * Script to populate the database with test users that have questionnaire data
 * This will make them visible in the Customer Service Dashboard
 */

const API_BASE = 'https://backend-gbhz.onrender.com';

const testUsers = [
  {
    email: 'conservative.trader@test.com',
    username: 'Conservative Trader',
    questionnaire_data: {
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
    risk_management_plan: {
      riskPerTrade: 0.5,
      dailyLossLimit: 1.5,
      maxLoss: 500,
      profitTarget: 800,
      tradesToPass: 8,
      riskAmount: 50,
      profitAmount: 100,
      consecutiveLossesLimit: 3,
      generatedAt: new Date().toISOString()
    }
  },
  {
    email: 'aggressive.trader@test.com',
    username: 'Aggressive Trader',
    questionnaire_data: {
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
    risk_management_plan: {
      riskPerTrade: 3.0,
      dailyLossLimit: 9.0,
      maxLoss: 5000,
      profitTarget: 8000,
      tradesToPass: 4,
      riskAmount: 3000,
      profitAmount: 9000,
      consecutiveLossesLimit: 2,
      generatedAt: new Date().toISOString()
    }
  },
  {
    email: 'moderate.trader@test.com',
    username: 'Moderate Trader',
    questionnaire_data: {
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
    risk_management_plan: {
      riskPerTrade: 1.5,
      dailyLossLimit: 4.5,
      maxLoss: 1250,
      profitTarget: 2000,
      tradesToPass: 4,
      riskAmount: 375,
      profitAmount: 938,
      consecutiveLossesLimit: 3,
      generatedAt: new Date().toISOString()
    }
  }
];

async function populateDatabaseUsers() {
  console.log('🚀 Populating database with test users...');
  
  for (const user of testUsers) {
    try {
      console.log(`\n👤 Creating user: ${user.username} (${user.email})`);
      
      // First, create the user
      const createUserResponse = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          username: user.username,
          password: 'TestPass123!',
          plan_type: 'premium'
        })
      });
      
      const createResult = await createUserResponse.json();
      console.log('Create user response:', createResult);
      
      if (createResult.success && createResult.user) {
        const userId = createResult.user.id;
        console.log(`✅ User created with ID: ${userId}`);
        
        // Now update the user with questionnaire data
        const updateResponse = await fetch(`${API_BASE}/api/users/${userId}/questionnaire`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_type: user.questionnaire_data.accountType,
            prop_firm: user.questionnaire_data.propFirm,
            account_size: user.questionnaire_data.accountSize,
            trading_experience: user.questionnaire_data.tradingExperience,
            risk_tolerance: user.questionnaire_data.riskTolerance,
            trading_goals: user.questionnaire_data.tradingGoals,
            questionnaire_data: user.questionnaire_data
          })
        });
        
        const updateResult = await updateResponse.json();
        console.log('Update questionnaire response:', updateResult);
        
        if (updateResult.success) {
          console.log(`✅ Questionnaire data saved for ${user.username}`);
        } else {
          console.log(`❌ Failed to save questionnaire data: ${updateResult.error}`);
        }
      } else {
        console.log(`❌ Failed to create user: ${createResult.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.username}:`, error);
    }
  }
  
  console.log('\n🔄 Checking database users...');
  try {
    const response = await fetch(`${API_BASE}/api/database/users`);
    const data = await response.json();
    console.log('Database users:', data);
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Run the function
populateDatabaseUsers();
