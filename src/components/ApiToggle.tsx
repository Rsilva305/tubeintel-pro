'use client';

import { useState, useEffect } from 'react';
import { getUseRealApi, setUseRealApi } from '@/services/api/config';

type ApiToggleProps = {
  onToggle?: (useRealApi: boolean) => void;
};

export default function ApiToggle({ onToggle }: ApiToggleProps) {
  // Initialize with undefined to prevent hydration mismatch
  const [useRealApi, setLocalUseRealApi] = useState<boolean | undefined>(undefined);

  // Initialize state from config when component mounts (client-side only)
  useEffect(() => {
    const currentSetting = getUseRealApi();
    setLocalUseRealApi(currentSetting);
  }, []);

  const handleToggle = () => {
    if (useRealApi !== undefined) {
      const newValue = !useRealApi;
      setLocalUseRealApi(newValue);
      setUseRealApi(newValue);
      if (onToggle) {
        onToggle(newValue);
      }
    }
  };

  // Don't render content until client-side initialization is complete
  if (useRealApi === undefined) {
    return <div className="h-6 w-28 bg-gray-200 animate-pulse rounded"></div>;
  }

  return (
    <div className="flex items-center">
      <span className={`mr-2 text-sm ${useRealApi ? 'text-gray-400' : 'font-semibold'}`}>
        Mock Data
      </span>
      <button 
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
          useRealApi ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span className="sr-only">Toggle API Mode</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            useRealApi ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`ml-2 text-sm ${useRealApi ? 'font-semibold' : 'text-gray-400'}`}>
        Real YouTube API
      </span>
    </div>
  );
} 