'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionStatus, SubscriptionState } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';

interface SubscriptionContextType {
  plan: SubscriptionStatus;
  status: SubscriptionState;
  isLoading: boolean;
  isSubscribed: boolean;
  expiresAt: Date | null;
  refreshSubscription: () => Promise<void>;
  checkAfterUpgrade: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [status, setStatus] = useState<SubscriptionState>('loading');
  const [plan, setPlan] = useState<SubscriptionStatus>('free');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  const checkSubscription = async () => {
    try {
      console.log('Checking subscription status...');
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      if (response.ok) {
        if (data.subscribed) {
          console.log('Active subscription found:', data.plan);
          setStatus('active');
          setPlan(data.plan as SubscriptionStatus);
          setExpiresAt(data.subscription?.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd) : null);
        } else {
          console.log('No active subscription found');
          setStatus('inactive');
          setPlan('free');
          setExpiresAt(null);
        }
      } else {
        console.error('Error fetching subscription status:', data.error);
        setStatus('error');
        setPlan('free');
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      setStatus('error');
      setPlan('free');
    }
  };
  
  // Special function to check after an upgrade
  const checkAfterUpgrade = async () => {
    console.log('Checking subscription after upgrade...');
    setStatus('loading');
    await checkSubscription();
  };
  
  // Set up Supabase auth listener to detect login/logout
  useEffect(() => {
    // Initial subscription check on mount
    checkSubscription();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // User just signed in, check their subscription
          console.log('User signed in, checking subscription');
          checkSubscription();
        } else if (event === 'SIGNED_OUT') {
          // User signed out, reset to free plan
          console.log('User signed out, resetting subscription to free');
          setStatus('inactive');
          setPlan('free');
          setExpiresAt(null);
        }
      }
    );
    
    // No visibility change handler, no periodic checks
    
    // Clean up
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const refreshSubscription = async () => {
    setStatus('loading');
    await checkSubscription();
  };
  
  const value = {
    plan,
    status,
    isLoading: status === 'loading',
    isSubscribed: status === 'active',
    expiresAt,
    refreshSubscription,
    checkAfterUpgrade
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
} 