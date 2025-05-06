'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaYoutube, FaUser, FaCog, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/lib/supabase';

interface TopNavProps {
  username?: string;
}

export default function TopNav({ username = 'User' }: TopNavProps): JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <header className={`h-16 ${bgColor} border-b ${borderColor} flex items-center justify-between px-6 shadow-sm`}>
      <div>
        <h2 className={`text-xl font-semibold ${textColor}`}>YouTube Analytics Dashboard</h2>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
        <Link href="/test-api" className="mr-2 flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          <FaYoutube className="mr-1" />
          <span>Test API</span>
        </Link>
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-full ${theme === 'dark' 
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} 
            transition-colors duration-200`}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <FaSun className="text-yellow-400 h-5 w-5" />
          ) : (
            <FaMoon className="text-indigo-600 h-5 w-5" />
          )}
        </button>
        
        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden flex items-center justify-center`}>
              <FaUser className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <span className={textColor}>{username}</span>
            {dropdownOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 15L12 9L18 15" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 py-2`}>
              <div className={`px-4 py-2 border-b ${borderColor} mb-2`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden flex items-center justify-center`}>
                    <FaUser className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${textColor}`}>{username}</p>
                  </div>
                </div>
              </div>
              
              <Link href="/dashboard/settings" className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Account Settings
              </Link>
              
              <div className={`border-t ${borderColor} mt-2 pt-2`}>
                <button 
                  className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 