'use client';

import { useState, useEffect } from 'react';
import { FaCrown, FaStar } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type SubscriptionTier = 'free' | 'pro' | 'pro-plus';

interface UpgradeButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'inline' | 'full';
}

export default function UpgradeButton({ 
  className = '', 
  size = 'medium',
  variant = 'inline'
}: UpgradeButtonProps) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  
  // Once component mounts, set isClient to true
  useEffect(() => {
    setIsClient(true);
    
    // Get current subscription from localStorage
    try {
      const savedPlan = localStorage.getItem('subscription') as SubscriptionTier || 'free';
      setCurrentPlan(savedPlan);
    } catch (error) {
      console.error('Error getting subscription from localStorage:', error);
    }
  }, []);
  
  // Don't render anything during SSR to prevent hydration issues
  if (!isClient) {
    return null;
  }
  
  // If user already has Pro+, don't show upgrade button
  if (currentPlan === 'pro-plus') {
    return null;
  }
  
  // Handle button click - direct navigation to subscription page
  const handleUpgradeClick = () => {
    router.push('/subscription');
  };
  
  // Size classes
  const sizeClasses = {
    small: 'text-xs py-1 px-2',
    medium: 'text-sm py-2 px-3',
    large: 'text-base py-3 px-4'
  };
  
  // Icon based on current plan
  const icon = currentPlan === 'pro' ? <FaStar className="mr-1.5" /> : <FaCrown className="mr-1.5" />;
  
  // Button text based on current plan
  const buttonText = currentPlan === 'pro' ? 'Upgrade to Pro+' : 'Upgrade to Pro';
  
  // Return button with appropriate styling
  return (
    <button
      onClick={handleUpgradeClick}
      className={`
        flex items-center justify-center font-medium rounded-full transition-colors
        ${sizeClasses[size]}
        ${variant === 'full' ? 'w-full' : ''}
        ${currentPlan === 'pro' 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white' 
          : 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white'
        }
        ${className}
      `}
    >
      {icon}
      {buttonText}
    </button>
  );
} 