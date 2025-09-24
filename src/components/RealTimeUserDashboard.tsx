import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { DollarSign, Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const RealTimeUserDashboard: React.FC = () => {
  const { user } = useUser();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user?.email) return;

    // Load user's dashboard data
    const loadUserData = () => {
      const userDashboardKey = `dashboard_data_${user.email}`;
      const userTradingStateKey = `trading_state_${user.email}`;
      const userNotificationsKey = `user_notifications_${user.email}`;

      // Load dashboard data
      const dashboardData = localStorage.getItem(userDashboardKey);
      if (dashboardData) {
        try {
          setDashboardData(JSON.parse(dashboardData));
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      }

      // Load notifications
      const notificationsData = localStorage.getItem(userNotificationsKey);
      if (notificationsData) {
        try {
          setNotifications(JSON.parse(notificationsData).slice(0, 5)); // Show last 5 notifications
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      }
    };

    loadUserData();
    setLastUpdate(new Date());

    // Check for updates every 2 seconds
    const interval = setInterval(loadUserData, 2000);

    return () => clearInterval(interval);
  }, [user?.email]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading User Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <style>{`
        .quantum-bg {
          background: radial-gradient(ellipse at center, #0a0a1f 0%, #000000 100%);
          position: relative;
          overflow: hidden;
        }
        .quantum-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .quantum-card {
          background: rgba(0, 20, 40, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          position: relative;
          backdrop-filter: blur(10px);
          animation: holo-float 6s ease-in-out infinite;
        }
        @keyframes holo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      
      <div className="quantum-bg">
        <div className="quantum-grid"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="quantum-card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">User Dashboard</h1>
                <p className="text-gray-400">Welcome back, {user.name}</p>
                <p className="text-sm text-cyan-400">User ID: {user.uniqueId}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Live Updates</span>
                </div>
                <p className="text-xs text-gray-500">Last update: {lastUpdate.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="quantum-card mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                Recent Updates
              </h3>
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-900/30 rounded-lg border border-cyan-400/20"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="quantum-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-300">Account Balance</p>
                  <p className="text-3xl font-bold text-white">
                    ${dashboardData?.performance?.accountBalance?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            
            <div className="quantum-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Total P&L</p>
                  <p className={`text-3xl font-bold ${(dashboardData?.performance?.totalPnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(dashboardData?.performance?.totalPnl || 0) >= 0 ? '+' : ''}${(dashboardData?.performance?.totalPnl || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="quantum-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300">Win Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {(dashboardData?.performance?.winRate || 0).toFixed(1)}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Real-time Status */}
          <div className="quantum-card">
            <h3 className="text-xl font-semibold text-white mb-4">Real-time Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/30 rounded-lg">
                <h4 className="text-cyan-300 font-medium mb-2">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Size:</span>
                    <span className="text-white">${dashboardData?.userProfile?.accountSize?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Equity:</span>
                    <span className="text-white">${dashboardData?.performance?.accountBalance?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prop Firm:</span>
                    <span className="text-white">{dashboardData?.userProfile?.propFirm || 'Not Set'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-900/30 rounded-lg">
                <h4 className="text-cyan-300 font-medium mb-2">Trading Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="text-white">{dashboardData?.performance?.totalTrades || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-white">{(dashboardData?.performance?.winRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update:</span>
                    <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeUserDashboard;
