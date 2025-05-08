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
      }`}
      title="Refresh data (clears 4-hour cache)"
    >
      <FaSync className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">Refresh</span>
    </button>
  );
} 