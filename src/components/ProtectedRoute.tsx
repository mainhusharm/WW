import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useUser();
  const location = useLocation();

  console.log('ProtectedRoute - Auth State:', { user, isLoading, path: location.pathname });

  if (isLoading) {
    console.log('ProtectedRoute - Loading user data...');
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!user || !user.isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
