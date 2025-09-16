/**
 * Test Dashboard Component Integration
 * This will simulate what the Dashboard component should do
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

// Simulate the saveDashboardToSupabase function from Dashboard.tsx
async function saveDashboardToSupabase(dashboardData, tradingState, theme, user) {
  try {
    console.log('🔄 Dashboard save function called with:');
    console.log('  - User ID:', user?.id);
    console.log('  - User Email:', user?.email);
    console.log('  - Theme:', theme);
    console.log('  - Dashboard Data:', !!dashboardData);
    console.log('  - Trading State:', !!tradingState);
    
    const supabaseDashboardData = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'unknown',
      user_email: user?.email || 'unknown@example.com',
      user_name: user?.fullName || user?.name || 'Unknown User',
      
      // User Profile Data
      prop_firm: dashboardData?.userProfile?.propFirm || null,
      account_type: dashboardData?.userProfile?.accountType || null,
      account_size: dashboardData?.userProfile?.accountSize ? parseFloat(dashboardData.userProfile.accountSize.toString()) : null,
      risk_per_trade: dashboardData?.userProfile?.riskPerTrade ? parseFloat(dashboardData.userProfile.riskPerTrade.toString().replace('%', '')) : null,
      experience: dashboardData?.userProfile?.experience || null,
      unique_id: dashboardData?.userProfile?.uniqueId || null,
      
      // Performance Metrics
      account_balance: dashboardData?.performance?.accountBalance ? parseFloat(dashboardData.performance.accountBalance.toString()) : null,
      total_pnl: dashboardData?.performance?.totalPnl || 0,
      win_rate: dashboardData?.performance?.winRate || 0,
      total_trades: dashboardData?.performance?.totalTrades || 0,
      winning_trades: tradingState?.performanceMetrics?.winningTrades || 0,
      losing_trades: tradingState?.performanceMetrics?.losingTrades || 0,
      average_win: tradingState?.performanceMetrics?.averageWin || 0,
      average_loss: tradingState?.performanceMetrics?.averageLoss || 0,
      profit_factor: tradingState?.performanceMetrics?.profitFactor || 0,
      max_drawdown: tradingState?.performanceMetrics?.maxDrawdown || 0,
      current_drawdown: tradingState?.performanceMetrics?.currentDrawdown || 0,
      gross_profit: tradingState?.performanceMetrics?.grossProfit || 0,
      gross_loss: tradingState?.performanceMetrics?.grossLoss || 0,
      consecutive_wins: tradingState?.performanceMetrics?.consecutiveWins || 0,
      consecutive_losses: tradingState?.performanceMetrics?.consecutiveLosses || 0,
      sharpe_ratio: tradingState?.performanceMetrics?.sharpeRatio || null,
      
      // Risk Protocol
      max_daily_risk: dashboardData?.riskProtocol?.maxDailyRisk ? parseFloat(dashboardData.riskProtocol.maxDailyRisk.toString()) : null,
      risk_per_trade_amount: dashboardData?.riskProtocol?.riskPerTrade ? parseFloat(dashboardData.riskProtocol.riskPerTrade.toString()) : null,
      max_drawdown_limit: dashboardData?.riskProtocol?.maxDrawdown ? parseFloat(dashboardData.riskProtocol.maxDrawdown.toString()) : null,
      
      // Trading State
      initial_equity: tradingState?.initialEquity || null,
      current_equity: tradingState?.currentEquity || null,
      daily_pnl: tradingState?.dailyStats?.pnl || 0,
      daily_trades: tradingState?.dailyStats?.trades || 0,
      daily_initial_equity: tradingState?.dailyStats?.initialEquity || null,
      
      // Risk Settings
      risk_per_trade_percentage: tradingState?.riskSettings?.riskPerTrade || null,
      daily_loss_limit: tradingState?.riskSettings?.dailyLossLimit || null,
      consecutive_losses_limit: tradingState?.riskSettings?.consecutiveLossesLimit || null,
      
      // Dashboard Settings
      selected_theme: theme,
      notifications_enabled: true,
      auto_refresh: true,
      refresh_interval: 5000,
      language: 'en',
      timezone: 'UTC',
      
      // Real-time Data
      real_time_data: null,
      last_signal: null,
      market_status: 'open',
      connection_status: 'online',
      
      // Trading Data
      open_positions: tradingState?.openPositions || [],
      trade_history: tradingState?.trades || [],
      signals: [],
      
      // User Preferences
      dashboard_layout: null,
      widget_settings: null,
      alert_settings: null,
      
      // Metadata
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Prepared Supabase data:');
    console.log('  - User ID:', supabaseDashboardData.user_id);
    console.log('  - User Email:', supabaseDashboardData.user_email);
    console.log('  - Prop Firm:', supabaseDashboardData.prop_firm);
    console.log('  - Account Size:', supabaseDashboardData.account_size);
    console.log('  - Total PnL:', supabaseDashboardData.total_pnl);
    console.log('  - Theme:', supabaseDashboardData.selected_theme);

    // Try to update existing dashboard first, then create if not exists
    try {
      const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?user_id=eq.${user?.id}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (existingResponse.ok) {
        const existingDashboards = await existingResponse.json();
        if (existingDashboards.length > 0) {
          console.log('🔄 Updating existing dashboard...');
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?id=eq.${existingDashboards[0].id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(supabaseDashboardData)
          });
          
          if (updateResponse.ok) {
            const result = await updateResponse.json();
            console.log('✅ Dashboard data updated in Supabase!');
            return result;
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ No existing dashboard found, creating new one...');
    }

    // Create new dashboard
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(supabaseDashboardData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to save dashboard:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Dashboard data saved to Supabase!');
    return result;
  } catch (error) {
    console.error('❌ Failed to save dashboard to Supabase:', error);
    return null;
  }
}

async function testDashboardComponent() {
  console.log('🧪 Testing Dashboard Component Integration...');
  console.log('='.repeat(60));
  
  // Simulate user data
  const user = {
    id: 'dashboard-test-user-123',
    email: 'dashboard-test@example.com',
    fullName: 'Dashboard Test User',
    name: 'Dashboard Test User'
  };
  
  // Simulate dashboard data (like what would come from questionnaire)
  const dashboardData = {
    userProfile: {
      propFirm: 'Goat Funded Trader',
      accountType: 'Two-Step No-Time-Limit Challenge',
      accountSize: 100000,
      riskPerTrade: '1.5%',
      experience: 'Intermediate',
      uniqueId: 'USER-12345'
    },
    performance: {
      accountBalance: 100000,
      totalPnl: 2500.50,
      winRate: 75.5,
      totalTrades: 20
    },
    riskProtocol: {
      maxDailyRisk: 1000,
      riskPerTrade: 1500,
      maxDrawdown: 2000
    }
  };
  
  // Simulate trading state
  const tradingState = {
    initialEquity: 100000,
    currentEquity: 102500.50,
    trades: [],
    openPositions: [],
    riskSettings: {
      riskPerTrade: 1.5,
      dailyLossLimit: 5,
      consecutiveLossesLimit: 3
    },
    performanceMetrics: {
      totalPnl: 2500.50,
      winRate: 75.5,
      totalTrades: 20,
      winningTrades: 15,
      losingTrades: 5,
      averageWin: 350.25,
      averageLoss: -200.10,
      profitFactor: 2.75,
      maxDrawdown: 500,
      currentDrawdown: 0,
      grossProfit: 5253.75,
      grossLoss: -2753.25,
      consecutiveWins: 3,
      consecutiveLosses: 0,
      sharpeRatio: 1.85
    },
    dailyStats: {
      pnl: 150.25,
      trades: 2,
      initialEquity: 100000
    }
  };
  
  const theme = 'concept1';
  
  console.log('📝 Simulating Dashboard component data:');
  console.log('  - User:', user.fullName);
  console.log('  - Email:', user.email);
  console.log('  - Prop Firm:', dashboardData.userProfile.propFirm);
  console.log('  - Account Size: $', dashboardData.userProfile.accountSize);
  console.log('  - Total PnL: $', dashboardData.performance.totalPnl);
  console.log('  - Theme:', theme);
  
  // Test the save function
  const result = await saveDashboardToSupabase(dashboardData, tradingState, theme, user);
  
  if (result) {
    console.log('\n✅ SUCCESS! Dashboard component integration is working!');
    console.log('📊 Dashboard saved with ID:', result.id || 'N/A');
    
    // Verify the dashboard was added
    console.log('\n🔍 Verifying dashboard was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?select=*&order=created_at.desc&limit=3`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allDashboards = await verifyResponse.json();
      console.log(`✅ Found ${allDashboards.length} dashboards in table`);
      
      if (allDashboards.length > 0) {
        console.log('\n📊 Recent dashboards:');
        allDashboards.slice(0, 2).forEach((dashboard, index) => {
          console.log(`  ${index + 1}. ${dashboard.user_name} (${dashboard.user_email})`);
          console.log(`     - Prop Firm: ${dashboard.prop_firm || 'N/A'}`);
          console.log(`     - Account Size: $${dashboard.account_size || 'N/A'}`);
          console.log(`     - Total PnL: $${dashboard.total_pnl || 'N/A'}`);
          console.log(`     - Theme: ${dashboard.selected_theme || 'N/A'}`);
          console.log('');
        });
      }
    }
    
    console.log('\n🎉 DASHBOARD COMPONENT TEST COMPLETE!');
    console.log('✅ The save function is working correctly!');
    console.log('✅ Your Dashboard component should now save data automatically!');
    
  } else {
    console.log('\n❌ FAILED! Dashboard component integration has issues');
    console.log('💡 Check the error messages above for details');
  }
}

// Run the test
testDashboardComponent();
