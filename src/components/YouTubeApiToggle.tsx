'use client';

import { useState, useEffect, useRef } from 'react';
import { getUseYoutubeApi, setUseYoutubeApi } from '@/services/api/config';
import { FaYoutube } from 'react-icons/fa';

type YouTubeApiToggleProps = {
  className?: string;
};

export default function YouTubeApiToggle({ className = '' }: YouTubeApiToggleProps) {
  // Initialize with undefined to prevent hydration mismatch
  const [useYoutubeApi, setLocalUseYoutubeApi] = useState<boolean | undefined>(undefined);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Initialize state from config when component mounts (client-side only)
  useEffect(() => {
    const currentSetting = getUseYoutubeApi();
    setLocalUseYoutubeApi(currentSetting);
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (useYoutubeApi !== undefined) {
      const newValue = !useYoutubeApi;
      setLocalUseYoutubeApi(newValue);
      setUseYoutubeApi(newValue);
    }
  };

  // Don't render content until client-side initialization is complete
  if (useYoutubeApi === undefined) {
    return <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>;
  }

  const statusText = useYoutubeApi ? "ON" : "OFF";
  const statusClass = useYoutubeApi ? "text-green-500" : "text-gray-400";

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div 
        className="flex items-center gap-1 cursor-pointer" 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <FaYoutube className={useYoutubeApi ? "text-red-500" : "text-gray-400"} size={16} />
        <span className={`text-xs font-semibold ${statusClass}`}>{statusText}</span>
        <button 
          onClick={handleToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            useYoutubeApi ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          aria-label="Toggle YouTube API"
        >
          <span className="sr-only">Toggle YouTube API</span>
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              useYoutubeApi ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3 text-sm"
        >
          <p className="font-medium mb-1 text-gray-900 dark:text-white">YouTube API {useYoutubeApi ? 'Enabled' : 'Disabled'}</p>
          <p className="text-gray-600 dark:text-gray-300">
            {useYoutubeApi 
              ? "Using live YouTube data. API quota may be limited." 
              : "Using cached data. No API calls will be made."}
          </p>
        </div>
      )}
    </div>
  );
} 