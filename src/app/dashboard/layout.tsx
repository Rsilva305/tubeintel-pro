'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaYoutube, FaChartLine, FaUsers, FaLightbulb, FaBell, FaUser, FaCog, FaMoon, FaSun } from 'react-icons/fa';
import { getCurrentUser, signOut, isAuthenticated } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          // Not authenticated, redirect to login
          console.log('Not authenticated, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Get the current user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // No user found, redirect to login
          console.log('No user found, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white dark:bg-gray-950">
        <div className="p-4 flex items-center">
          <FaYoutube className="text-red-500 text-3xl mr-2" />
          <h1 className="text-xl font-bold">TubeIntel Pro</h1>
        </div>
        <nav className="p-4">
          <ul>
            <li className="mb-4">
              <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700 dark:hover:bg-gray-800">
                <FaChartLine className="mr-2" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/dashboard/competitors" className="flex items-center p-2 rounded hover:bg-gray-700 dark:hover:bg-gray-800">
                <FaUsers className="mr-2" />
                <span>Competitors</span>
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/dashboard/insights" className="flex items-center p-2 rounded hover:bg-gray-700 dark:hover:bg-gray-800">
                <FaLightbulb className="mr-2" />
                <span>Insights</span>
              </Link>
            </li>
            <li className="mb-4">
              <Link href="/dashboard/settings" className="flex items-center p-2 rounded hover:bg-gray-700 dark:hover:bg-gray-800">
                <FaCog className="mr-2" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold dark:text-white">YouTube Analytics Dashboard</h2>
          </div>
          <div className="flex items-center">
            <Link href="/test-api" className="mr-4 flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <FaYoutube className="mr-1" />
              <span>Test API</span>
            </Link>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="mr-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <FaSun className="text-yellow-400" />
              ) : (
                <FaMoon className="text-indigo-600" />
              )}
            </button>
            
            <div className="relative ml-2">
              <button 
                onClick={toggleDropdown}
                className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaCog className="text-gray-600 dark:text-gray-400" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <Link href="/test-api" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      YouTube API Test
                    </Link>
                    <a 
                      href="#" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setShowDropdown(false);
                      }}
                    >
                      Settings
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="ml-4 relative">
              <div className="flex items-center">
                <FaUser className="text-gray-600 dark:text-gray-400 mr-2" />
                <span className="dark:text-white">{user?.username || user?.email?.split('@')[0] || 'User'}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="ml-4 text-sm bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded"
            >
              Logout
            </button>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
} 