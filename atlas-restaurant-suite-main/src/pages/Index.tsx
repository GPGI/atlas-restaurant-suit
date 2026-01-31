import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import PremiumMenu from './PremiumMenu';

const Index: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const isVip = searchParams.get('vip') === 'true';

  // If table parameter exists, show the premium menu
  if (tableId) {
    return <PremiumMenu />;
  }

  // Otherwise, redirect to table selection
  return <Navigate to="/tables" replace />;
};

export default Index;
