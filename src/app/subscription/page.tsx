'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCrown, FaStar, FaCheck, FaLock } from 'react-icons/fa';
import Link from 'next/link';

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
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  
  // Mock function to get the current subscription
  useEffect(() => {
    // In a real app, you would fetch this from your backend
    const savedPlan = localStorage.getItem('subscription') as SubscriptionTier || 'free';
    setCurrentPlan(savedPlan);
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
    
    try {
      // Simulate an API call to your payment processor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would integrate with Stripe or another payment processor here
      
      // For demo purposes, just update localStorage
      localStorage.setItem('subscription', tier);
      setCurrentPlan(tier);
      
      setMessage({
        type: 'success',
        text: `Successfully upgraded to ${tier === 'pro-plus' ? 'Pro+' : 'Pro'}!`
      });
      
      // In a real app, you might redirect to a confirmation page
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
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
          <div className={`max-w-xl mx-auto mb-8 p-4 rounded-lg ${
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
                className="mt-6 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-300 font-medium" 
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
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
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
                className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
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
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
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
                className={`mt-6 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
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