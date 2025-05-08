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
  
  // Initialize metrics collection on app start
  useEffect(() => {
    async function initialize() {
      try {
        // Make sure the user is authenticated before initializing metrics collection
        const user = await getCurrentUser();
        if (!user) {
          console.log('Metrics scheduler not initialized: User not authenticated');
          return;
        }
        
        // Initialize the metrics scheduler
        console.log('Initializing metrics scheduler...');
        initializeMetricsScheduler();
        
        // Update state
        setIsInitialized(true);
        setLastCollectionDate(new Date().toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error initializing metrics scheduler:', error);
        setHasError(true);
      }
    }
    
    initialize();
  }, []);
  
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