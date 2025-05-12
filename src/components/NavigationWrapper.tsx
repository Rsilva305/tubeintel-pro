'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

export default function NavigationWrapper({ children }: NavigationWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('User');
  const { theme } = useTheme();
  
  // Get username from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the current user ID first
      const currentUserId = localStorage.getItem('currentUserId');
      
      if (currentUserId) {
        // Use the user-specific storage key
        const storedUser = localStorage.getItem(`user_${currentUserId}`);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUsername(userData.username || userData.email?.split('@')[0] || 'User');
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      } else {
        // For backward compatibility, try the old key
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUsername(userData.username || userData.email?.split('@')[0] || 'User');
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }
      }
    }
  }, []);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div className="flex min-h-screen bg-gray-900 w-full h-full overflow-hidden">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col bg-gray-900 min-h-screen">
        <TopNav username={username} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 