import React from 'react';

const TestAICoach: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">🧪 TEST: AI Coach Component</h2>
          <p className="text-gray-300 mb-4">
            If you can see this message, the AI Coach component is working!
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left text-sm">
            <p className="text-gray-400 mb-2">This is a test component to verify the AI Coach is loading.</p>
            <p className="text-green-400">✅ Component is rendering correctly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAICoach;
