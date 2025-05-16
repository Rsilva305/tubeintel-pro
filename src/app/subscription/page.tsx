'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCrown, FaStar, FaCheck, FaLock } from 'react-icons/fa';
import Link from 'next/link';
import { PRODUCTS } from '@/utils/stripe';

// Debug logs for component lifecycle
console.log('Subscription page module loaded');

// Subscription types
type SubscriptionTier = 'free' | 'pro' | 'pro-plus';

// Feature definitions for each plan
interface Feature {
  name: string;
  included: {
    free: boolean;
    pro: boolean;
    proPlus: boolean;
  };
}

const features: Feature[] = [
  {
    name: 'Basic Analytics Dashboard',
    included: { free: true, pro: true, proPlus: true }
  },
  {
    name: 'Track up to 5 competitors',
    included: { free: true, pro: true, proPlus: true }
  },
  {
    name: 'Basic Insights',
    included: { free: true, pro: true, proPlus: true }
  },
  {
    name: 'Image Coder Tool',
    included: { free: false, pro: true, proPlus: true }
  },
  {
    name: 'Advanced Trend Analysis',
    included: { free: false, pro: true, proPlus: true }
  },
  {
    name: 'Track unlimited competitors',
    included: { free: false, pro: true, proPlus: true }
  },
  {
    name: 'AI Content Recommendations',
    included: { free: false, pro: false, proPlus: true }
  },
  {
    name: 'Advanced Audience Insights',
    included: { free: false, pro: false, proPlus: true }
  },
  {
    name: 'Priority Support',
    included: { free: false, pro: false, proPlus: true }
  }
];

export default function SubscriptionPage() {
  console.log('Subscription page component rendered');
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [isStripeAvailable, setIsStripeAvailable] = useState<boolean | null>(null);
  
  // Check for cancel/success status in URL and initialize component
  useEffect(() => {
    // Log environment variables (not the values, just whether they exist)
    console.log('Stripe public key exists:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
    
    // Safely check URL parameters
    try {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('canceled')) {
        setMessage({
          type: 'info',
          text: 'Payment canceled. You can try again when you\'re ready.'
        });
      } else if (urlParams.get('success')) {
        setMessage({
          type: 'success',
          text: 'Payment successful! Your subscription is now active.'
        });
      }
      
      // Get current user's subscription from localStorage
      const savedPlan = localStorage.getItem('subscription') as SubscriptionTier || 'free';
      setCurrentPlan(savedPlan);
      
      // Always enable Stripe for now, we'll implement proper checks later
      setIsStripeAvailable(true);
    } catch (error) {
      console.error('Error in subscription page initialization:', error);
    }
  }, []);
  
  // Handle subscription change
  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === currentPlan) {
      setMessage({
        type: 'info',
        text: `You're already subscribed to ${tier === 'pro-plus' ? 'Pro+' : 'Pro'}`
      });
      return;
    }
    
    setIsLoading(true);
    console.log('Starting subscription process for tier:', tier);
    
    try {
      // Always update localStorage for demo purposes
      localStorage.setItem('subscription', tier);
      
      // For Stripe integration - only import when needed
      const { getStripe } = await import('@/utils/stripe');
      
      // Determine the Stripe price ID based on the selected plan
      const priceId = tier === 'pro' 
        ? PRODUCTS.PRO.priceId 
        : PRODUCTS.PRO_PLUS.priceId;
      
      console.log('Using price ID:', priceId);
      
      // Call our checkout API endpoint
      console.log('Calling checkout API endpoint...');
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planType: tier,
        }),
      });
      
      console.log('Checkout API response status:', response.status);
      const result = await response.json();
      console.log('Checkout API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }
      
      // Redirect to Stripe Checkout or success page
      if (result.url) {
        console.log('Redirecting to:', result.url);
        window.location.href = result.url;
        return;
      }
      
      // If we got a success response without URL (demo mode in API)
      setCurrentPlan(tier);
      setMessage({
        type: 'success',
        text: `Successfully upgraded to ${tier === 'pro-plus' ? 'Pro+' : 'Pro'}`
      });
      
    } catch (error) {
      console.error('Subscription error:', error);
      setMessage({
        type: 'error',
        text: 'There was an error processing your subscription. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderCheckmark = (included: boolean) => {
    if (included) {
      return <FaCheck className="text-green-500" />;
    }
    return <FaLock className="text-gray-400" />;
  };
  
  console.log('Rendering subscription page UI');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold dark:text-white mb-3">
            Upgrade Your YouTube Analytics Experience
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Choose the plan that's right for you and take your YouTube channel to the next level
          </p>
        </div>
        
        {message && (
          <div className={`max-w-xl mx-auto mb-8 p-4 rounded-full ${
            message.type === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : message.type === 'error'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
          }`}>
            <p>{message.text}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">Free</h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Basic analytics for your channel</p>
              <div className="mt-4">
                <span className="text-4xl font-bold dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {renderCheckmark(feature.included.free)}
                    </div>
                    <span className={`text-sm ${!feature.included.free ? 'text-gray-500 dark:text-gray-500' : 'dark:text-gray-300'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button 
                className="mt-6 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-300 font-medium" 
                disabled
              >
                Current Plan
              </button>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transform transition-transform hover:shadow-lg relative">
            {/* Highlight if current plan */}
            {currentPlan === 'pro' && (
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
            )}
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <FaCrown className="text-blue-500" /> Pro
                </h2>
                {currentPlan === 'pro' && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Advanced analytics and tools</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">$9.99</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {renderCheckmark(feature.included.pro)}
                    </div>
                    <span className={`text-sm ${!feature.included.pro ? 'text-gray-500 dark:text-gray-500' : 'dark:text-gray-300'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSubscribe('pro')}
                disabled={isLoading || currentPlan === 'pro'}
                className={`mt-6 w-full py-2 px-4 rounded-full font-medium transition-colors ${
                  currentPlan === 'pro'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : currentPlan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
          
          {/* Pro Plus Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transform transition-transform hover:shadow-lg relative">
            {/* Highlight if current plan */}
            {currentPlan === 'pro-plus' && (
              <div className="absolute top-0 inset-x-0 h-1 bg-purple-500"></div>
            )}
            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <FaStar className="text-purple-500" /> Pro+
                </h2>
                {currentPlan === 'pro-plus' && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Premium AI-powered insights</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">$19.99</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">/month</span>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                      {renderCheckmark(feature.included.proPlus)}
                    </div>
                    <span className={`text-sm ${!feature.included.proPlus ? 'text-gray-500 dark:text-gray-500' : 'dark:text-gray-300'}`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSubscribe('pro-plus')}
                disabled={isLoading || currentPlan === 'pro-plus'}
                className={`mt-6 w-full py-2 px-4 rounded-full font-medium transition-colors ${
                  currentPlan === 'pro-plus'
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : currentPlan === 'pro-plus' ? 'Current Plan' : 'Upgrade to Pro+'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 