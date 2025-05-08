'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaYoutube, FaUser, FaCog, FaSun, FaMoon } from 'react-icons/fa';
import { Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/lib/supabase';
import YouTubeApiToggle from './YouTubeApiToggle';
import RefreshCacheButton from './RefreshCacheButton';

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
      // First remove localStorage data
      localStorage.removeItem('user');
      localStorage.removeItem('youtubeChannelId');
      localStorage.removeItem('competitorLists');
      
      // Then try Supabase signout
      await signOut();
      
      // Redirect to landing page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to the landing page
      window.location.href = '/';
    }
  };

  const handleComingSoonClick = (feature: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    alert(`${feature} feature coming soon!`);
    setDropdownOpen(false);
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
        {/* YouTube API Toggle */}
        <YouTubeApiToggle />
        
        {/* Refresh Cache Button */}
        <RefreshCacheButton />
        
        {/* Extension Button */}
        <button 
          onClick={handleComingSoonClick('Browser Extension')}
          className="flex items-center gap-1 text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">Extension</span>
        </button>
        
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
            <div className={`absolute right-0 mt-2 w-56 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 py-2`}>
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
              
              <a href="#" onClick={handleComingSoonClick('Discord')} className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Discord
              </a>
              <a href="#" onClick={handleComingSoonClick('Billing')} className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Billing
              </a>
              <a href="#" onClick={handleComingSoonClick('Affiliates')} className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Affiliates
              </a>
              <a href="#" onClick={handleComingSoonClick('Contact Support')} className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Contact support
              </a>
              <a href="#" onClick={handleComingSoonClick('Bug Report')} className={`block px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                Report a bug
              </a>
              
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