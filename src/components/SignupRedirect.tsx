import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SignupRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Always redirect to enhanced signup form
    console.log('✅ Redirecting to enhanced signup');
    navigate('/signup-enhanced', { 
      state: location.state,
      replace: true 
    });
    setIsChecking(false);
  }, [navigate, location.state]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-semibold">Checking signup options...</h2>
          <p className="text-gray-300 mt-2">Please wait while we prepare the best signup experience for you.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SignupRedirect;
