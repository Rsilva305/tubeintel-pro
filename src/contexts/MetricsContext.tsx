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
    let userCache: any = null;
    let lastCheck = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    
    async function checkAndInit() {
      const now = Date.now();
      
      // Use cached user if within cache duration
      if (userCache && (now - lastCheck) < CACHE_DURATION) {
        if (userCache && !isInitialized) {
          console.log('Initializing metrics scheduler with cached user...');
          initializeMetricsScheduler();
          setIsInitialized(true);
          setLastCollectionDate(new Date().toISOString().split('T')[0]);
        }
        return;
      }
      
      // Only fetch user if cache is expired
      const currentUser = await getCurrentUser();
      userCache = currentUser;
      lastCheck = now;
      setUser(currentUser);
      
      if (currentUser && !isInitialized) {
        console.log('Initializing metrics scheduler after authentication...');
        initializeMetricsScheduler();
        setIsInitialized(true);
        setLastCollectionDate(new Date().toISOString().split('T')[0]);
      }
    }
    
    checkAndInit();
    // Reduced frequency and with caching - check every 30 seconds instead of 3
    const interval = setInterval(checkAndInit, 30000);
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