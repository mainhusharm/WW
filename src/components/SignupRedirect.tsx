import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SignupRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkBackendAndRedirect = async () => {
      try {
        // Test if the backend is available
        const response = await fetch('http://localhost:5000/health', {
          method: 'GET',
          timeout: 3000
        });
        
        if (response.ok) {
          // Backend is available, use enhanced signup
          console.log('✅ Backend available, using enhanced signup');
          navigate('/signup-enhanced', { 
            state: location.state,
            replace: true 
          });
        } else {
          throw new Error('Backend not responding');
        }
      } catch (error) {
        console.log('❌ Backend not available, using fixed signup:', error);
        // Backend not available, use fixed signup
        navigate('/signup-fixed', { 
          state: location.state,
          replace: true 
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkBackendAndRedirect();
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
