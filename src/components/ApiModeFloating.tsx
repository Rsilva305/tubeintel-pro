'use client';

import { useState, useEffect } from 'react';
import { getUseRealApi, setUseRealApi } from '@/services/api/config';
import { FaDatabase, FaTimes } from 'react-icons/fa';

interface ApiModeFloatingProps {
  onChange?: (useRealApi: boolean) => void;
}

export default function ApiModeFloating({ onChange }: ApiModeFloatingProps) {
  const [useRealApi, setUseRealApiState] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
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
    <div className="fixed bottom-4 right-4 z-50">
      {isExpanded ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex flex-col items-center animate-fade-in">
          <button 
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={14} />
          </button>
          
          <p className="text-sm font-medium mb-2">API Mode</p>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs ${useRealApi ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>
              Demo
            </span>
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
            <span className={`text-xs ${useRealApi ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              Real
            </span>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-1">
            {useRealApi ? 'Changes will be saved to database' : 'Changes will not be saved'}
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`rounded-full p-3 shadow-lg ${
            useRealApi ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
          title="Toggle API Mode"
        >
          <FaDatabase size={16} />
        </button>
      )}
    </div>
  );
} 