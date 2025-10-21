import React, { useEffect } from 'react';

const CustomerServiceRedirect: React.FC = () => {
  useEffect(() => {
    // Automatically redirect to the working customer service
    window.location.href = 'http://localhost:3005';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-4">Redirecting to Customer Service...</h2>
        <p className="text-indigo-100 mb-6">Taking you to the working customer service dashboard</p>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm">If you're not redirected automatically,</p>
          <button 
            onClick={() => window.location.href = 'http://localhost:3005'}
            className="mt-2 bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Click Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceRedirect;
