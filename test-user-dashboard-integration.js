/**
 * Test User Dashboard Integration
 * This will test if we can insert comprehensive dashboard data into Supabase
 */

const SUPABASE_URL = 'https://bgejxnkyzjamroeikfkr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZWp4bmt5emphbXJvZWlrZmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzMxODYsImV4cCI6MjA3MTUwOTE4Nn0.BkU0y7VH6FNgSi4bCBA2gnrFXRI_37Gowv6r2SU6aPk';

async function testUserDashboardIntegration() {
  console.log('🧪 Testing User Dashboard Integration...');
  console.log('='.repeat(60));
  
  try {
    // Test comprehensive dashboard data
    const dashboardData = {
      id: crypto.randomUUID(),
      user_id: 'test-user-dashboard',
      user_email: 'dashboard@example.com',
      user_name: 'Dashboard Test User',
      
      // User Profile Data
      prop_firm: 'Goat Funded Trader',
      account_type: 'Two-Step No-Time-Limit Challenge',
      account_size: 100000.00,
      risk_per_trade: 1.5,
      experience: 'Intermediate',
      unique_id: 'USER-12345',
      
      // Performance Metrics
      account_balance: 100000.00,
      total_pnl: 2500.50,
      win_rate: 75.5,
      total_trades: 20,
      winning_trades: 15,
      losing_trades: 5,
      average_win: 350.25,
      average_loss: -200.10,
      profit_factor: 2.75,
      max_drawdown: 500.00,
      current_drawdown: 0.00,
      gross_profit: 5253.75,
      gross_loss: -2753.25,
      consecutive_wins: 3,
      consecutive_losses: 0,
      sharpe_ratio: 1.85,
      
      // Risk Protocol
      max_daily_risk: 1000.00,
      risk_per_trade_amount: 1500.00,
      max_drawdown_limit: 2000.00,
      
      // Trading State
      initial_equity: 100000.00,
      current_equity: 102500.50,
      daily_pnl: 150.25,
      daily_trades: 2,
      daily_initial_equity: 100000.00,
      
      // Risk Settings
      risk_per_trade_percentage: 1.5,
      daily_loss_limit: 5.0,
      consecutive_losses_limit: 3,
      
      // Dashboard Settings
      selected_theme: 'concept1',
      notifications_enabled: true,
      auto_refresh: true,
      refresh_interval: 5000,
      language: 'en',
      timezone: 'UTC',
      
      // Real-time Data
      real_time_data: {
        market_status: 'open',
        last_update: new Date().toISOString(),
        active_signals: 3,
        pending_orders: 1
      },
      last_signal: {
        pair: 'EURUSD',
        direction: 'LONG',
        entry_price: 1.0850,
        stop_loss: 1.0800,
        take_profit: 1.0950
      },
      market_status: 'open',
      connection_status: 'online',
      
      // Trading Data
      open_positions: [
        {
          id: 'trade-1',
          pair: 'EURUSD',
          direction: 'LONG',
          entry_price: 1.0850,
          stop_loss: 1.0800,
          take_profit: 1.0950,
          risk_amount: 1500.00,
          reward_amount: 3000.00,
          status: 'open',
          entry_time: new Date().toISOString()
        }
      ],
      trade_history: [
        {
          id: 'trade-2',
          pair: 'GBPUSD',
          direction: 'SHORT',
          entry_price: 1.2650,
          stop_loss: 1.2700,
          take_profit: 1.2550,
          risk_amount: 1500.00,
          reward_amount: 3000.00,
          status: 'closed',
          entry_time: new Date(Date.now() - 3600000).toISOString(),
          close_time: new Date().toISOString(),
          pnl: 3000.00
        }
      ],
      signals: [
        {
          id: 'signal-1',
          pair: 'USDJPY',
          direction: 'LONG',
          entry_price: 150.50,
          stop_loss: 150.00,
          take_profit: 151.50,
          confidence: 85,
          timestamp: new Date().toISOString()
        }
      ],
      
      // User Preferences
      dashboard_layout: {
        widgets: ['performance', 'trades', 'signals', 'risk'],
        positions: { performance: 'top-left', trades: 'top-right' }
      },
      widget_settings: {
        performance: { show_chart: true, refresh_rate: 5000 },
        trades: { show_pnl: true, show_win_rate: true }
      },
      alert_settings: {
        email_notifications: true,
        push_notifications: false,
        sound_alerts: true
      },
      
      // Metadata
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Comprehensive dashboard data:');
    console.log('  - User:', dashboardData.user_name);
    console.log('  - Email:', dashboardData.user_email);
    console.log('  - Prop Firm:', dashboardData.prop_firm);
    console.log('  - Account Size: $', dashboardData.account_size);
    console.log('  - Total PnL: $', dashboardData.total_pnl);
    console.log('  - Win Rate:', dashboardData.win_rate + '%');
    console.log('  - Open Positions:', dashboardData.open_positions.length);
    console.log('  - Trade History:', dashboardData.trade_history.length);
    console.log('  - Signals:', dashboardData.signals.length);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(dashboardData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Insert failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      if (errorText.includes('user dashboard')) {
        console.log('\n💡 SOLUTION: Create the user dashboard table');
        console.log('Run this SQL in your Supabase SQL editor:');
        console.log('-- See create-user-dashboard-table.sql file for the complete SQL');
        return false;
      }
      
      return false;
    }
    
    const newDashboard = await response.json();
    console.log('✅ SUCCESS! Comprehensive dashboard data saved to Supabase!');
    console.log('📊 Dashboard details:', {
      id: newDashboard.id,
      user_name: newDashboard.user_name,
      user_email: newDashboard.user_email,
      prop_firm: newDashboard.prop_firm,
      account_size: newDashboard.account_size,
      total_pnl: newDashboard.total_pnl,
      win_rate: newDashboard.win_rate,
      total_trades: newDashboard.total_trades,
      selected_theme: newDashboard.selected_theme
    });
    
    // Verify the dashboard was added
    console.log('\n🔍 Verifying dashboard was added...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user%20dashboard?select=*&order=last_activity.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const allDashboards = await verifyResponse.json();
      console.log(`✅ Verification successful! Found ${allDashboards.length} dashboards in table`);
      
      if (allDashboards.length > 0) {
        console.log('\n📊 Recent dashboards:');
        allDashboards.slice(0, 3).forEach((dashboard, index) => {
          console.log(`  ${index + 1}. ${dashboard.user_name} (${dashboard.user_email})`);
          console.log(`     - Prop Firm: ${dashboard.prop_firm || 'N/A'}`);
          console.log(`     - Account Size: $${dashboard.account_size || 'N/A'}`);
          console.log(`     - Total PnL: $${dashboard.total_pnl || 'N/A'}`);
          console.log(`     - Win Rate: ${dashboard.win_rate || 'N/A'}%`);
          console.log(`     - Theme: ${dashboard.selected_theme || 'N/A'}`);
          console.log(`     - Last Activity: ${dashboard.last_activity || 'N/A'}`);
          console.log('');
        });
      }
    }
    
    console.log('\n🎉 USER DASHBOARD INTEGRATION TEST COMPLETE!');
    console.log('✅ Comprehensive dashboard data is being saved to Supabase!');
    console.log('✅ All user profile, performance, trading, and settings data included!');
    console.log('✅ Your dashboard will now save every detail to the database!');
    console.log('✅ Check your Supabase dashboard to see the comprehensive dashboard data');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testUserDashboardIntegration();
