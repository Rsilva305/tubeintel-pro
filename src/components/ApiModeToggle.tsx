'use client';

import { useState, useEffect } from 'react';
import { getUseRealApi, setUseRealApi } from '@/services/api/config';

interface ApiModeToggleProps {
  onChange?: (useRealApi: boolean) => void;
  className?: string;
}

export default function ApiModeToggle({ onChange, className = '' }: ApiModeToggleProps) {
  const [useRealApi, setUseRealApiState] = useState(false);
  
  // Initialize state on client-side
  useEffect(() => {
    setUseRealApiState(getUseRealApi());
  }, []);
  
  // Toggle API mode
  const toggleApiMode = () => {
    const newValue = !useRealApi;
    setUseRealApi(newValue);
    setUseRealApiState(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500">Demo</span>
      <button 
        onClick={toggleApiMode}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          useRealApi ? 'bg-green-500' : 'bg-gray-300'
        }`}
        title={useRealApi ? 'Using real API' : 'Using demo mode'}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            useRealApi ? 'translate-x-6' : 'translate-x-1'
          }`} 
        />
      </button>
      <span className="text-sm text-gray-500">Real</span>
    </div>
  );
} 