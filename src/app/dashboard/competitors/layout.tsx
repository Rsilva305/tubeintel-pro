'use client';

import React, { useEffect } from 'react';
import ApiModeFloating from '@/components/ApiModeFloating';

export default function CompetitorsLayout({ children }: { children: React.ReactNode }) {
  // Handle API mode changes
  const handleApiModeChange = (useRealApi: boolean) => {
    // We can optionally add refresh or notification logic here
    console.log('API mode changed:', useRealApi ? 'REAL' : 'DEMO');
  };

  return (
    <>
      {children}
      <ApiModeFloating onChange={handleApiModeChange} />
    </>
  );
} 