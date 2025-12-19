import React, { useState, useEffect } from 'react';

// Component to debug and fix dashboard data reading
const DashboardDataFix: React.FC = () => {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [questionnaireData, setQuestionnaireData] = useState<any>(null);
  const [riskPlanData, setRiskPlanData] = useState<any>(null);

  useEffect(() => {
    // Read all localStorage data
    const allData: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(allData);

    // Specifically read questionnaire data
    const questionnaireRaw = localStorage.getItem('questionnaireAnswers');
    const riskPlanRaw = localStorage.getItem('riskManagementPlan');
    
    try {
      setQuestionnaireData(questionnaireRaw ? JSON.parse(questionnaireRaw) : null);
    } catch (e) {
      console.error('Error parsing questionnaire data:', e);
    }
    
    try {
      setRiskPlanData(riskPlanRaw ? JSON.parse(riskPlanRaw) : null);
    } catch (e) {
      console.error('Error parsing risk plan data:', e);
    }
  }, []);

  const fixDashboardData = () => {
    // Create proper dashboard data structure
    const dashboardData = {
      userProfile: {
        propFirm: questionnaireData?.propFirm || riskPlanData?.propFirm || 'QuantTekel',
        accountType: questionnaireData?.accountType || riskPlanData?.accountType || 'QuantTekel Instant',
        experience: questionnaireData?.experience || riskPlanData?.experience || 'intermediate',
        initialBalance: questionnaireData?.accountSize || riskPlanData?.accountSize || 10000,
        uniqueId: localStorage.getItem('userUniqueId') || '952244'
      }
    };

    // Save to localStorage
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
    console.log('Dashboard data fixed:', dashboardData);
    
    // Reload page to see changes
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Dashboard Data Debug</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Questionnaire Data:</h3>
        <pre className="bg-gray-700 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(questionnaireData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Risk Plan Data:</h3>
        <pre className="bg-gray-700 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(riskPlanData, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">All LocalStorage Data:</h3>
        <pre className="bg-gray-700 p-3 rounded text-sm overflow-auto max-h-96">
          {JSON.stringify(localStorageData, null, 2)}
        </pre>
      </div>

      <button 
        onClick={fixDashboardData}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        Fix Dashboard Data
      </button>
    </div>
  );
};

export default DashboardDataFix;
