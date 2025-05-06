'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaYoutube } from 'react-icons/fa';
import { getCurrentUser, isAuthenticated, supabase } from '@/lib/supabase';

export default function OnboardingPage() {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }
        
        // Get current user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Check if we're in demo mode
          if (currentUser.id === '1') {
            setIsDemo(true);
          }
          
          // Check if user has already completed onboarding
          const storedChannelId = localStorage.getItem('youtubeChannelId');
          if (storedChannelId) {
            // User has already completed onboarding, redirect to dashboard
            router.push('/dashboard');
          }
        } else {
          // No user found, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const extractChannelId = (url: string) => {
    try {
      const urlObj = new URL(url);
      
      // Handle different YouTube URL formats
      if (urlObj.hostname.includes('youtube.com')) {
        // Format: youtube.com/channel/UC...
        if (urlObj.pathname.includes('/channel/')) {
          const parts = urlObj.pathname.split('/');
          const index = parts.indexOf('channel');
          if (index !== -1 && index + 1 < parts.length) {
            return parts[index + 1];
          }
        }
        
        // Format: youtube.com/c/ChannelName or youtube.com/@username
        if (urlObj.pathname.includes('/c/') || urlObj.pathname.includes('/@')) {
          // We'll return the part after /c/ or /@ as a channel identifier
          const parts = urlObj.pathname.split('/');
          return parts[parts.length - 1];
        }
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
    
    return '';
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setChannelUrl(url);
    
    const extractedId = extractChannelId(url);
    if (extractedId) {
      setChannelId(extractedId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId && !channelUrl) {
      setError('Please enter your YouTube channel ID or URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the final channel ID
      const finalChannelId = channelId || extractChannelId(channelUrl);
      
      if (!finalChannelId) {
        throw new Error('Could not extract a valid YouTube channel ID');
      }
      
      // Store the channel ID in localStorage for immediate use
      localStorage.setItem('youtubeChannelId', finalChannelId);
      
      // Update the user object with completed onboarding
      const updatedUser = { ...user, hasCompletedOnboarding: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // If we're not in demo mode, update the profile in Supabase
      if (!isDemo && user && user.id !== '1') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ youtube_channel_id: finalChannelId })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Continue anyway since we stored in localStorage
        }
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save channel information');
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
          <p className="text-gray-600 dark:text-gray-400">Let's set up your YouTube channel</p>
        </div>
        
        {/* Onboarding Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Channel Setup</h2>
          
          {user && (
            <p className="text-center mb-6 dark:text-gray-300">
              Welcome, <span className="font-semibold">{user.username || user.email?.split('@')[0]}</span>! 
              Let's complete your setup.
            </p>
          )}
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="channelUrl" className="block text-gray-700 dark:text-gray-300 mb-2">
                YouTube Channel URL
              </label>
              <input
                id="channelUrl"
                type="text"
                value={channelUrl}
                onChange={handleUrlChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://youtube.com/channel/..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your full YouTube channel URL (e.g., https://youtube.com/channel/UC...)
              </p>
            </div>
            
            <div className="flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="mx-4 text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            
            <div>
              <label htmlFor="channelId" className="block text-gray-700 dark:text-gray-300 mb-2">
                Channel ID
              </label>
              <input
                id="channelId"
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="UC..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your YouTube channel ID directly if you know it
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
          
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Note:</span> {isDemo 
                ? "You're in demo mode. Your channel ID will only be stored locally." 
                : "Your YouTube channel ID will be stored in your profile and used to fetch analytics."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 