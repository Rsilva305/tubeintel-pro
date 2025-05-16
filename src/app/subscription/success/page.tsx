'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Invalid session');
      setIsLoading(false);
      return;
    }
    
    // Handle demo sessions (from development mode)
    if (sessionId.startsWith('demo_session_')) {
      localStorage.setItem('subscription', 'pro');
      
      setSubscription({
        planName: 'Pro',
        startDate: new Date().toLocaleDateString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
      
      setIsLoading(false);
      return;
    }
    
    // Verify the payment session and update local state
    const verifyPayment = async () => {
      try {
        // Fetch session details from our backend, which will verify with Stripe
        const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to verify session');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Store subscription info in localStorage (for client-side checks)
          localStorage.setItem('subscription', data.subscription.plan_type || 'pro');
          
          // Format the data for display
          setSubscription({
            planName: data.subscription.plan_type === 'pro-plus' ? 'Pro+' : 'Pro',
            startDate: new Date(data.subscription.created_at).toLocaleDateString(),
            nextBillingDate: new Date(data.subscription.current_period_end).toLocaleDateString()
          });
        } else {
          throw new Error(data.error || 'Verification failed');
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'Failed to verify your subscription. Please contact support.');
        setIsLoading(false);
      }
    };
    
    verifyPayment();
  }, [searchParams]);
  
  // Redirect to dashboard after a few seconds
  useEffect(() => {
    if (!isLoading && !error) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Confirming your subscription...
            </h2>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">×</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Subscription Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <Link href="/subscription">
              <span className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-full">
                Return to Plans
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your {subscription?.planName} subscription is now active
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300">Plan:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subscription?.planName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300">Start date:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subscription?.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">Next billing date:</span>
              <span className="font-medium text-gray-900 dark:text-white">{subscription?.nextBillingDate}</span>
            </div>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            You'll be redirected to your dashboard in a few seconds...
          </p>
          
          <Link href="/dashboard">
            <span className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-full">
              Go to Dashboard
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
} 