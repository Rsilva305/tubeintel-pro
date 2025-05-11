'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeMetricsScheduler, forceCollectMetrics } from '@/services/metrics/scheduler';
import { TrendData } from '@/services/metrics/history';
import { getCurrentUser } from '@/lib/supabase';

interface MetricsContextType {
  isInitialized: boolean;
  lastCollectionDate: string | null;
  collectMetricsNow: () => Promise<boolean>;
  isCollecting: boolean;
  hasError: boolean;
}

const initialState: MetricsContextType = {
  isInitialized: false,
  lastCollectionDate: null,
  collectMetricsNow: async () => false,
  isCollecting: false,
  hasError: false
};

const MetricsContext = createContext<MetricsContextType>(initialState);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastCollectionDate, setLastCollectionDate] = useState<string | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Watch for authentication changes and initialize metrics scheduler
  useEffect(() => {
    async function checkAndInit() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser && !isInitialized) {
        console.log('Initializing metrics scheduler after authentication...');
        initializeMetricsScheduler();
        setIsInitialized(true);
        setLastCollectionDate(new Date().toISOString().split('T')[0]);
      }
    }
    checkAndInit();
    // Optionally, set up an interval to re-check authentication every few seconds
    const interval = setInterval(checkAndInit, 3000);
    return () => clearInterval(interval);
  }, [isInitialized]);
  
  // Function to manually collect metrics
  const collectMetricsNow = async (): Promise<boolean> => {
    try {
      setIsCollecting(true);
      setHasError(false);
      
      const result = await forceCollectMetrics();
      
      if (result) {
        setLastCollectionDate(new Date().toISOString().split('T')[0]);
      }
      
      return result;
    } catch (error) {
      console.error('Error collecting metrics:', error);
      setHasError(true);
      return false;
    } finally {
      setIsCollecting(false);
    }
  };
  
  const value = {
    isInitialized,
    lastCollectionDate,
    collectMetricsNow,
    isCollecting,
    hasError
  };
  
  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
} 