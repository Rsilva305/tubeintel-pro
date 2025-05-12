'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaYoutube } from 'react-icons/fa';
import Link from 'next/link';
import { signIn, isAuthenticated } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

// Define interface for the extended sign-in result
interface SignInResult {
  user: any;
  session: any;
  hasCompletedOnboarding?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        // User is already logged in, check if they need onboarding
        const currentUserId = localStorage.getItem('currentUserId');
        if (currentUserId) {
          const userJson = localStorage.getItem(`user_${currentUserId}`);
          if (userJson) {
            try {
              const userData = JSON.parse(userJson);
              // Check for user-specific channel ID
              const hasChannel = !!localStorage.getItem(`user_${currentUserId}_youtubeChannelId`);
              
              // If the user has completed onboarding or has a YouTube channel ID, go to dashboard
              if (userData.hasCompletedOnboarding || hasChannel) {
                router.push('/dashboard');
              } else {
                router.push('/onboarding');
              }
            } catch (e) {
              console.error('Error parsing user data:', e);
              // If there's an error, direct to onboarding to be safe
              router.push('/onboarding');
            }
          } else {
            // No user data but authenticated, go to onboarding
            router.push('/onboarding');
          }
        } else {
          // No current user ID, go to onboarding
          router.push('/onboarding');
        }
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Real Supabase authentication
      const result = await signIn(email, password) as SignInResult;
      
      if (!result.user) {
        throw new Error('Authentication failed. No user returned.');
      }
      
      console.log('Login successful:', result.user, 'Onboarding completed:', result.hasCompletedOnboarding);
      
      // Check if user has completed onboarding based on return value or localStorage
      const hasChannel = !!localStorage.getItem(`user_${result.user.id}_youtubeChannelId`);
      if (result.hasCompletedOnboarding || hasChannel) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <FaYoutube className="text-red-500 text-4xl mr-2" />
            <h1 className="text-3xl font-bold dark:text-white">TubeIntel Pro</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Your YouTube Analytics Dashboard</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-center dark:text-white">Sign In</h2>
          </div>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Don't have an account? <Link href="/signup" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">Sign up</Link>
            </p>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Note:</span> You need a valid Supabase account to log in. Please contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
} 