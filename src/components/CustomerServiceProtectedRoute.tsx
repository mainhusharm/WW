import React from 'react';
import { Navigate } from 'react-router-dom';

const CustomerServiceProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const csToken = localStorage.getItem('cs_token');

  if (!csToken) {
    return <Navigate to="/customer-service" />;
  }

  return children;
};

export default CustomerServiceProtectedRoute;
