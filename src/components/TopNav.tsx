'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaYoutube, FaUser, FaCog } from 'react-icons/fa';
import { Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/lib/supabase';
import RefreshCacheButton from './RefreshCacheButton';

interface TopNavProps {
  username?: string;
}

export default function TopNav({ username = 'User' }: TopNavProps): JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
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

  const bgColor = 'bg-gray-900';
  const borderColor = 'border-gray-700';
  const textColor = 'text-white';

  return (
    <header className={`h-16 ${bgColor} border-b ${borderColor} flex items-center justify-between px-6 shadow-sm`}>
      <div>
        <h2 className={`text-xl font-semibold ${textColor}`}>YouTube Analytics Dashboard</h2>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-4">
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
        
        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
              <FaUser className="h-4 w-4 text-gray-300" />
            </div>
            <span className={textColor}>{username}</span>
            {dropdownOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 15L12 9L18 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 border-gray-700 border rounded-lg shadow-lg z-50 py-2">
              <div className="px-4 py-2 border-b border-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                    <FaUser className="h-4 w-4 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{username}</p>
                  </div>
                </div>
              </div>
              
              <a href="#" onClick={handleComingSoonClick('Discord')} className="block px-4 py-2 hover:bg-gray-700 text-gray-300">
                Discord
              </a>
              <a href="#" onClick={handleComingSoonClick('Billing')} className="block px-4 py-2 hover:bg-gray-700 text-gray-300">
                Billing
              </a>
              <a href="#" onClick={handleComingSoonClick('Affiliates')} className="block px-4 py-2 hover:bg-gray-700 text-gray-300">
                Affiliates
              </a>
              <a href="#" onClick={handleComingSoonClick('Contact Support')} className="block px-4 py-2 hover:bg-gray-700 text-gray-300">
                Contact support
              </a>
              <a href="#" onClick={handleComingSoonClick('Bug Report')} className="block px-4 py-2 hover:bg-gray-700 text-gray-300">
                Report a bug
              </a>
              
              <div className="border-t border-gray-700 mt-2 pt-2">
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300"
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