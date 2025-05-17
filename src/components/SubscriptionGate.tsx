'use client';

import { ReactNode } from 'react';
import { useSubscription, SubscriptionStatus } from '@/hooks/useSubscription';
import Link from 'next/link';

interface SubscriptionGateProps {
  children: ReactNode;
  minimumPlan?: SubscriptionStatus;
  fallback?: ReactNode;
}

/**
 * A component that controls access to content based on subscription level.
 * It will show the children only if the user has the required subscription.
 * Otherwise, it will show the fallback content or a default upgrade prompt.
 */
export default function SubscriptionGate({
  children,
  minimumPlan = 'pro',
  fallback
}: SubscriptionGateProps) {
  const { plan, isLoading } = useSubscription();
  
  // Check if user has access
  const hasAccess = !isLoading && (
    (minimumPlan === 'pro' && (plan === 'pro' || plan === 'pro-plus')) ||
    (minimumPlan === 'pro-plus' && plan === 'pro-plus') ||
    (minimumPlan === 'free')
  );
  
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Show fallback content if provided
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default upgrade prompt
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {minimumPlan === 'pro-plus' ? 'Pro+ Plan Required' : 'Pro Plan Required'}
      </h3>
      <p className="text-gray-600 mb-4">
        Upgrade your subscription to unlock this feature.
      </p>
      <Link 
        href="/subscription" 
        className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        View Pricing
      </Link>
    </div>
  );
} 