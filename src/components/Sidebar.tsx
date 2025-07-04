'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FaYoutube, 
  FaChartLine, 
  FaUsers, 
  FaLightbulb, 
  FaCog,
  FaBars,
  FaCrown,
  FaStar,
  FaLock,
  FaImage
} from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import UpgradeButton from './UpgradeButton';
import { useSubscription } from '@/hooks/useSubscription';

// Subscription types
type SubscriptionTier = 'free' | 'pro' | 'pro-plus';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  collapsed?: boolean;
  locked?: boolean;
  requiredSubscription?: SubscriptionTier;
  currentSubscription?: SubscriptionTier;
}

const SidebarItem = ({ 
  icon, 
  label, 
  href, 
  isActive, 
  collapsed, 
  locked = false,
  requiredSubscription,
  currentSubscription 
}: SidebarItemProps): JSX.Element => {
  const { theme } = useTheme();
  
  // Check if feature is locked based on subscription tier
  const isFeatureLocked = locked || (
    requiredSubscription && 
    currentSubscription && 
    (
      (requiredSubscription === 'pro' && currentSubscription === 'free') ||
      (requiredSubscription === 'pro-plus' && (currentSubscription === 'free' || currentSubscription === 'pro'))
    )
  );
  
  return (
    <Link 
      href={isFeatureLocked ? '/subscription' : href}
      className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? `${theme === 'dark' ? 'bg-[#00264d] text-blue-200' : 'bg-blue-100 text-blue-800'}` 
          : `${theme === 'dark' ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`
      } ${isFeatureLocked ? 'opacity-70' : ''}`}
    >
      <div className={collapsed ? 'flex justify-center items-center w-full' : ''}>
        {icon}
      </div>
      {!collapsed && (
        <>
          <span className="text-sm font-medium transition-opacity duration-200 flex-1">{label}</span>
          {isFeatureLocked && <FaLock size={12} className="text-gray-400" />}
        </>
      )}
    </Link>
  );
};

// Section divider component
const SectionDivider = ({ label, collapsed }: { label: string, collapsed: boolean }) => {
  if (collapsed) return <div className="border-t border-gray-700 my-3 mx-2"></div>;
  
  return (
    <div className="px-3 py-2 mt-2">
      <div className="flex items-center">
        <div className="border-t border-gray-700 flex-grow mr-2"></div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div className="border-t border-gray-700 flex-grow ml-2"></div>
      </div>
    </div>
  );
};

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { plan, isLoading } = useSubscription();
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  
  // Update subscription tier when the plan changes
  useEffect(() => {
    if (!isLoading) {
      setSubscriptionTier(plan);
      
      // For debugging - log the subscription status
      console.log('Subscription plan from API:', plan);
    }
  }, [plan, isLoading]);
  
  const isActive = (path: string): boolean => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  const bgColor = 'bg-gray-800';
  const borderColor = 'border-gray-700';
  const textColor = 'text-white';
  
  return (
    <div 
      className={`${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      } h-screen flex-shrink-0 bg-white/10 backdrop-blur-md border-r border-white/20 py-6 flex flex-col transition-all duration-300 ease-in-out`}
    >
      {collapsed ? (
        <>
          <div className="flex justify-center mb-6">
            <button 
              onClick={toggleSidebar}
              className={`${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-full transition-colors`}
              aria-label="Expand sidebar"
            >
              <FaBars className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex justify-center mb-6">
            <Link href="/dashboard">
              <div className="text-red-500">
                <FaYoutube className="h-7 w-7" />
              </div>
            </Link>
          </div>
        </>
      ) : (
        <div className="px-4 mb-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="text-red-500">
              <FaYoutube className="h-7 w-7" />
            </div>
            <span className={`font-bold text-xl ${textColor}`}>ClikStats</span>
            {subscriptionTier !== 'free' && (
              <span className={`${
                subscriptionTier === 'pro-plus' 
                  ? 'text-purple-500 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30' 
                  : 'text-blue-500 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30'
              } text-xs font-medium px-1.5 py-0.5 rounded`}>
                {subscriptionTier === 'pro-plus' ? 'Pro+' : 'Pro'}
              </span>
            )}
          </Link>

          <button 
            onClick={toggleSidebar}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} p-2 rounded-full transition-colors ml-auto`}
            aria-label="Collapse sidebar"
          >
            <FaBars className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Core Features */}
      <div className="flex flex-col gap-1 px-2 mt-4">
        <SidebarItem 
          icon={<FaChartLine size={18} />} 
          label="Dashboard" 
          href="/dashboard"
          isActive={isActive('/dashboard') && !isActive('/dashboard/competitors') && !isActive('/dashboard/insights') && !isActive('/dashboard/settings')} 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<FaUsers size={18} />} 
          label="Competitors" 
          href="/dashboard/competitors"
          isActive={isActive('/dashboard/competitors')} 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<FaLightbulb size={18} />} 
          label="Insights" 
          href="/dashboard/insights"
          isActive={isActive('/dashboard/insights')} 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<FaCog size={18} />} 
          label="Settings" 
          href="/dashboard/settings"
          isActive={isActive('/dashboard/settings')} 
          collapsed={collapsed}
        />
      </div>
      
      {/* Pro Features */}
      <SectionDivider label="PRO FEATURES" collapsed={collapsed} />
      <div className="flex flex-col gap-1 px-2">
        <SidebarItem 
          icon={<FaCrown size={18} className="text-blue-400" />} 
          label="Trend Analysis" 
          href="/dashboard/trends"
          isActive={isActive('/dashboard/trends')} 
          collapsed={collapsed}
          requiredSubscription="pro"
          currentSubscription={subscriptionTier}
        />
        <SidebarItem 
          icon={<FaImage size={18} className="text-blue-400" />} 
          label="Image Coder" 
          href="/image-coder"
          isActive={isActive('/image-coder')} 
          collapsed={collapsed}
          requiredSubscription="pro"
          currentSubscription={subscriptionTier}
        />
      </div>
      
      {/* Pro Plus Features */}
      <SectionDivider label="PRO+ FEATURES" collapsed={collapsed} />
      <div className="flex flex-col gap-1 px-2 relative">
        {/* Coming Soon Overlay for Pro+ Features */}
        {!collapsed && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg mx-1">
            <div className="bg-purple-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg transform -rotate-12">
              COMING SOON
            </div>
          </div>
        )}
        
        <SidebarItem 
          icon={<FaStar size={18} className="text-purple-400" />} 
          label="AI Recommendations" 
          href="/dashboard/recommendations"
          isActive={isActive('/dashboard/recommendations')} 
          collapsed={collapsed}
          requiredSubscription="pro-plus"
          currentSubscription={subscriptionTier}
        />
        <SidebarItem 
          icon={<FaUsers size={18} className="text-purple-400" />} 
          label="Advanced Audience" 
          href="/dashboard/audience"
          isActive={isActive('/dashboard/audience')} 
          collapsed={collapsed}
          requiredSubscription="pro-plus"
          currentSubscription={subscriptionTier}
        />
      </div>
      
      {/* Subscription link */}
      {!collapsed && subscriptionTier !== 'pro-plus' && (
        <div className="mt-4 mx-3">
          <UpgradeButton variant="full" className="w-full" />
        </div>
      )}
      
      <div className="mt-auto px-4">
        {!collapsed && (
          <div className={`border-t ${borderColor} pt-4`}>
            <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-xs`}>© 2024 ClikStats</p>
          </div>
        )}
      </div>
    </div>
  );
}