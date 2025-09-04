import React from 'react';
import Dashboard from './Dashboard';

interface Props {
  onLogout: () => void;
}

const DashboardWrapper = ({ onLogout }: Props) => {
  return <Dashboard onLogout={onLogout} />;
};

export default DashboardWrapper;
