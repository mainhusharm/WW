import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useUser();
  const location = useLocation();

  console.log('ProtectedRoute - Auth State:', { user, isLoading, path: location.pathname });

  if (isLoading) {
    console.log('ProtectedRoute - Loading user data...');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2>Loading TraderEdge Pro...</h2>
          <p>Please wait while we initialize the application</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Check React state first
  const isAuthenticatedInState = user && user.isAuthenticated;

  // Also check localStorage as backup (for cases where state hasn't updated yet)
  const storedUser = localStorage.getItem('current_user');
  const storedToken = localStorage.getItem('access_token') || sessionStorage.getItem('session_token');
  let isAuthenticatedInStorage = false;

  if (storedUser && storedToken) {
    try {
      const parsedUser = JSON.parse(storedUser);
      isAuthenticatedInStorage = parsedUser.isAuthenticated === true;
    } catch (error) {
      console.warn('Error parsing stored user data:', error);
    }
  }

  const isAuthenticated = isAuthenticatedInState || isAuthenticatedInStorage;

  console.log('ProtectedRoute - Auth checks:', {
    isAuthenticatedInState,
    isAuthenticatedInStorage,
    finalResult: isAuthenticated
  });

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
