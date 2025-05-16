'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { FaLock, FaCrown } from 'react-icons/fa';
import { getUserSubscription, hasFeatureAccess } from '@/utils/subscription';
import { useRouter } from 'next/navigation';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredFeature: 'basic' | 'pro' | 'pro-plus';
  fallback?: ReactNode;
}

export default function SubscriptionGate({ 
  children, 
  requiredFeature,
  fallback
}: SubscriptionGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    async function checkAccess() {
      try {
        // Get current user ID from localStorage
        const userId = localStorage.getItem('currentUserId');
        
        if (!userId) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }
        
        // Get user subscription
        const subscription = await getUserSubscription(userId);
        
        // Check if user has access to the required feature
        setHasAccess(hasFeatureAccess(requiredFeature, subscription));
      } catch (error) {
        console.error('Error checking feature access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAccess();
  }, [requiredFeature]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6 min-h-[200px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // If user has access, show the children
  if (hasAccess) {
    return children;
  }
  
  // If fallback is provided, use it
  if (fallback) {
    return fallback;
  }
  
  // Default fallback - upgrade prompt
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
          <FaLock className="text-yellow-600 dark:text-yellow-500 text-xl" />
        </div>
      </div>
      
      <h3 className="text-lg font-medium dark:text-white">
        Premium Feature
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">
        {requiredFeature === 'pro' 
          ? 'This feature requires a Pro subscription.' 
          : 'This feature requires a Pro+ subscription.'}
      </p>
      
      <Link href="/subscription">
        <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full font-medium">
          <FaCrown className="mr-2" />
          Upgrade Your Plan
        </span>
      </Link>
    </div>
  );
} 