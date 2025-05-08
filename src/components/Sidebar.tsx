'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FaYoutube, 
  FaChartLine, 
  FaUsers, 
  FaLightbulb, 
  FaCog,
  FaBars
} from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  collapsed?: boolean;
}

const SidebarItem = ({ icon, label, href, isActive, collapsed }: SidebarItemProps): JSX.Element => {
  const { theme } = useTheme();
  
  return (
    <Link 
      href={href}
      className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-900/20 text-blue-400' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <div className={collapsed ? 'flex justify-center items-center w-full' : ''}>
        {icon}
      </div>
      {!collapsed && <span className="text-sm font-medium transition-opacity duration-200">{label}</span>}
    </Link>
  );
};

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ collapsed, toggleSidebar }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const { theme } = useTheme();
  
  const isActive = (path: string): boolean => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  const bgColor = 'bg-gray-900';
  const borderColor = 'border-gray-700';
  const textColor = 'text-white';
  
  return (
    <div 
      className={`${
        collapsed ? 'w-[70px]' : 'w-[240px]'
      } h-screen flex-shrink-0 ${bgColor} border-r ${borderColor} py-6 flex flex-col transition-all duration-300 ease-in-out`}
      style={{ boxShadow: '0 0 10px 5px rgba(0,0,0,0.3)' }}
    >
      {collapsed ? (
        <>
          <div className="flex justify-center mb-6">
            <button 
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors"
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
            <span className={`font-bold text-xl ${textColor}`}>TubeIntel</span>
            <span className="text-blue-500 dark:text-blue-300 text-xs font-medium px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">Pro</span>
          </Link>

          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-colors ml-auto"
            aria-label="Collapse sidebar"
          >
            <FaBars className="h-5 w-5" />
          </button>
        </div>
      )}
      
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
      
      <div className="mt-auto px-4">
        {!collapsed && (
          <div className={`border-t ${borderColor} pt-4`}>
            <p className="text-gray-500 text-xs">© 2024 TubeIntel Pro</p>
          </div>
        )}
      </div>
    </div>
  );
} 