import React, { useState, useEffect } from 'react';

// Hook to read dashboard data from localStorage
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readDashboardData = () => {
      try {
        // Read questionnaire data
        const questionnaireRaw = localStorage.getItem('questionnaireAnswers');
        const riskPlanRaw = localStorage.getItem('riskManagementPlan');
        const userDataRaw = localStorage.getItem('userData');
        
        let questionnaireData = null;
        let riskPlanData = null;
        let userData = null;
        
        try {
          questionnaireData = questionnaireRaw ? JSON.parse(questionnaireRaw) : null;
        } catch (e) {
          console.warn('Error parsing questionnaire data:', e);
        }
        
        try {
          riskPlanData = riskPlanRaw ? JSON.parse(riskPlanRaw) : null;
        } catch (e) {
          console.warn('Error parsing risk plan data:', e);
        }
        
        try {
          userData = userDataRaw ? JSON.parse(userDataRaw) : null;
        } catch (e) {
          console.warn('Error parsing user data:', e);
        }

        // Extract data with fallbacks - only use hardcoded values if no real data exists
        const propFirm = questionnaireData?.propFirm || riskPlanData?.propFirm || 'Not Set';
        const accountType = questionnaireData?.accountType || riskPlanData?.accountType || 'Not Set';
        const experience = questionnaireData?.experience || riskPlanData?.experience || 'Not Set';
        const accountSize = questionnaireData?.accountSize || riskPlanData?.accountSize || 'Not Set';
        const uniqueId = userData?.uniqueId || localStorage.getItem('userUniqueId') || 'Not Set';

        const dashboardData = {
          userProfile: {
            propFirm: propFirm,
            accountType: accountType,
            experience: experience,
            accountSize: accountSize,
            uniqueId: uniqueId,
          },
          performance: {
            accountBalance: accountSize,
            totalPnl: 0,
            winRate: 0,
            totalTrades: 0,
          },
          riskProtocol: {
            maxDailyRisk: 5000,
            riskPerTrade: 1000,
            maxDrawdown: '10%',
          },
        };

        console.log('Dashboard data read from localStorage:', dashboardData);
        setDashboardData(dashboardData);
        setLoading(false);
      } catch (error) {
        console.error('Error reading dashboard data:', error);
        setLoading(false);
      }
    };

    readDashboardData();
  }, []);

  return { dashboardData, loading };
};

// Component to display dashboard data for debugging
export const DashboardDataDebug: React.FC = () => {
  const { dashboardData, loading } = useDashboardData();

  if (loading) {
    return <div className="text-white">Loading dashboard data...</div>;
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Dashboard Data Debug</h3>
      <div className="space-y-2">
        <div><strong>Prop Firm:</strong> {dashboardData?.userProfile?.propFirm || 'Not Set'}</div>
        <div><strong>Account Type:</strong> {dashboardData?.userProfile?.accountType || 'Not Set'}</div>
        <div><strong>Experience:</strong> {dashboardData?.userProfile?.experience || 'Not Set'}</div>
        <div><strong>Account Size:</strong> ${dashboardData?.userProfile?.accountSize || 'Not Set'}</div>
        <div><strong>Unique ID:</strong> {dashboardData?.userProfile?.uniqueId || 'Not Set'}</div>
      </div>
    </div>
  );
};

export default useDashboardData;
