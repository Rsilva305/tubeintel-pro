'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaYoutube, FaCopy, FaLink, FaQuestionCircle } from 'react-icons/fa';
import { supabase, isAuthenticated, getCurrentUser } from '@/lib/supabase';

interface ChannelPreview {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [channelPreview, setChannelPreview] = useState<ChannelPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
          
          // Check if user has already completed onboarding in Supabase
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('youtube_channel_id')
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            return;
          }

          if (profile?.youtube_channel_id) {
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

  const getChannelIdFromUrl = async (url: string): Promise<string> => {
    try {
      url = url.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('youtube.com')) {
        if (urlObj.pathname.includes('/channel/')) {
          const parts = urlObj.pathname.split('/');
          const index = parts.indexOf('channel');
          if (index !== -1 && index + 1 < parts.length) {
            const channelId = parts[index + 1];
            if (channelId.startsWith('UC') && channelId.length === 24) {
              return channelId;
            }
          }
        }
        
        if (urlObj.pathname.startsWith('/@')) {
          const username = urlObj.pathname.substring(2);
          if (username) {
            const response = await fetch(`/api/youtube/channel?username=${encodeURIComponent(username)}`);
            if (!response.ok) {
              throw new Error('Could not find channel for this username');
            }
            const data = await response.json();
            return data.channelId;
          }
        }

        if (urlObj.pathname.startsWith('/c/')) {
          const customUrl = urlObj.pathname.substring(3);
          if (customUrl) {
            const response = await fetch(`/api/youtube/channel?customUrl=${encodeURIComponent(customUrl)}`);
            if (!response.ok) {
              throw new Error('Could not find channel for this custom URL');
            }
            const data = await response.json();
            return data.channelId;
          }
        }
      }
      
      throw new Error('Invalid YouTube URL format');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get channel ID: ${error.message}`);
      }
      throw new Error('Failed to process YouTube URL');
    }
  };

  const handleUrlSubmit = async () => {
    if (!channelUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const extractedId = await getChannelIdFromUrl(channelUrl);
      if (extractedId) {
        setChannelId(extractedId);
        setChannelUrl('');
        fetchChannelPreview(extractedId);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChannelIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setChannelId(newId);
    setError('');

    if (newId.startsWith('UC') && newId.length === 24) {
      fetchChannelPreview(newId);
    } else {
      setChannelPreview(null);
    }
  };

  const fetchChannelPreview = async (id: string) => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch(`/api/youtube/channels?id=${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch channel info');
      }
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        setChannelPreview({
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.medium.url,
          subscriberCount: channel.statistics?.subscriberCount
        });
      } else {
        throw new Error('Channel not found');
      }
    } catch (error) {
      console.error('Error fetching channel preview:', error);
      setError('Failed to fetch channel information');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(channelId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId) {
      setError('Please enter your YouTube channel ID');
      return;
    }

    if (!channelId.startsWith('UC') || channelId.length !== 24) {
      setError('Invalid channel ID format');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          youtube_channel_id: channelId,
          has_completed_onboarding: true 
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw new Error('Failed to update profile: ' + updateError.message);
      }
      
      localStorage.setItem(`user_${user.id}_youtubeChannelId`, channelId);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save channel information');
    } finally {
      setIsLoading(false);
    }
  };

  const ChannelIdHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 dark:text-white">How to Find Your Channel ID</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 dark:text-white">Method 1: From Channel URL</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Go to your YouTube channel page</li>
                <li>Look at the URL in your browser</li>
                <li>If it contains "/channel/UC...", copy the part after "/channel/"</li>
                <li>If it contains "/@username" or "/c/ChannelName", use the URL converter above</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2 dark:text-white">Method 2: From YouTube Studio</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Go to YouTube Studio (studio.youtube.com)</li>
                <li>Click on "Settings" in the left menu</li>
                <li>Click on "Channel"</li>
                <li>Scroll down to find your channel ID</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Note:</span> Your channel ID is required for security and reliability. 
                It helps us provide accurate analytics and maintain efficient service.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
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
            {/* URL to ID Converter */}
            <div>
              <label htmlFor="channelUrl" className="block text-gray-700 dark:text-gray-300 mb-2">
                Convert YouTube URL to Channel ID
              </label>
              <div className="flex gap-2">
                <input
                  id="channelUrl"
                  type="text"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Paste YouTube channel or video URL"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FaLink />
                  Convert
                </button>
              </div>
            </div>

            {/* Channel ID Input */}
            <div>
              <label htmlFor="channelId" className="block text-gray-700 dark:text-gray-300 mb-2">
                YouTube Channel ID
              </label>
              <div className="flex gap-2">
                <input
                  id="channelId"
                  type="text"
                  value={channelId}
                  onChange={handleChannelIdChange}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="UC..."
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <FaCopy />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your YouTube channel ID (starts with "UC")
              </p>
            </div>

            {/* Channel Preview */}
            {isPreviewLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {channelPreview && !isPreviewLoading && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={channelPreview.thumbnailUrl} 
                    alt={channelPreview.title}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold dark:text-white">{channelPreview.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {channelPreview.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2"
              >
                <FaQuestionCircle />
                How to find my channel ID?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !channelId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Note:</span> Your channel ID will be securely stored and used to fetch analytics data about your channel only.
          </p>
        </div>
      </div>

      <ChannelIdHelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
} 