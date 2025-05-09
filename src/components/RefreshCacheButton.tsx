'use client';

import { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';

export default function RefreshCacheButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear the cache by reloading the page
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing cache:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        theme === 'dark'
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      } relative group`}
      title="Refresh data"
    >
      <FaSync className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">Refresh</span>
      
      {/* Detailed tooltip explaining the cache */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-64 shadow-lg z-10">
        <div className="relative">
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          <p className="font-semibold mb-1">Refresh Data Cache</p>
          <p className="mb-1">Clears all cached data with varied refresh times:</p>
          <ul className="list-disc list-inside">
            <li>Channel data: 24 hours</li>
            <li>Video data: 4 hours</li>
            <li>Search results: 2 hours</li>
            <li>Trending videos: 1 hour</li>
          </ul>
        </div>
      </div>
    </button>
  );
} 