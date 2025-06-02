'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaYoutube, FaSearch } from 'react-icons/fa';
import { supabase, isAuthenticated, getCurrentUser } from '@/lib/supabase';

// Define the search result type
interface ChannelSearchResult {
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
  
  // Add new state variables for channel search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add this state near the other state declarations
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // Add this helper function after the imports
  const getChannelIdFromUrl = async (url: string): Promise<string> => {
    try {
      // Clean the URL
      url = url.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      // Handle different YouTube URL formats
      if (urlObj.hostname.includes('youtube.com')) {
        // Format: youtube.com/channel/UC...
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
        
        // Format: youtube.com/@username
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

        // Format: youtube.com/c/ChannelName
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

  // Replace the existing extractChannelId function with this improved version
  const extractChannelId = async (url: string) => {
    try {
      // If it's already a channel ID, return it
      if (url.startsWith('UC') && url.length === 24) {
        return url;
      }

      // Try to get channel ID from URL
      return await getChannelIdFromUrl(url);
    } catch (error) {
      console.error('Error extracting channel ID:', error);
      throw error;
    }
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setChannelUrl(url);
    setError('');
    
    if (url) {
      try {
        const extractedId = await extractChannelId(url);
        if (extractedId) {
          setChannelId(extractedId);
        }
      } catch (err: any) {
        setError(err.message);
        setChannelId('');
      }
    } else {
      setChannelId('');
    }
  };

  // Add search function for channels
  const searchChannels = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setError('');
    
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&type=channel&maxResults=5`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      // Format results
      const formattedResults: ChannelSearchResult[] = data.items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.default.url
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching channels:', error);
      setError('Failed to search channels. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchChannels(searchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a channel from search results
  const selectChannel = (channel: ChannelSearchResult) => {
    setChannelId(channel.id);
    setSearchQuery(channel.title);
    setSearchResults([]);
  };

  // Handle direct channelId input changes
  const handleChannelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelId(e.target.value);
    // Clear the search query if user is manually entering a channel ID
    if (e.target.value) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId && !channelUrl && !searchQuery) {
      setError('Please search for or enter your YouTube channel URL or ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the final channel ID
      let finalChannelId = channelId;
      
      if (!finalChannelId && channelUrl) {
        finalChannelId = await extractChannelId(channelUrl);
      }
      
      if (!finalChannelId) {
        throw new Error('Could not extract a valid YouTube channel ID');
      }
      
      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          youtube_channel_id: finalChannelId,
          has_completed_onboarding: true 
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw new Error('Failed to update profile: ' + updateError.message);
      }
      
      // Store channel ID in user-specific localStorage
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId) {
        localStorage.setItem(`user_${currentUserId}_youtubeChannelId`, finalChannelId);
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

  // Add this new component before the return statement
  const ChannelIdHelpModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
          <h3 className="text-xl font-bold mb-4 dark:text-white">How to Find Your Channel ID</h3>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Follow these steps to find your YouTube channel ID:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>Go to your YouTube channel page</li>
              <li>Right-click anywhere on the page and select "View Page Source"</li>
              <li>Press Ctrl+F (or Cmd+F on Mac) to open the search box</li>
              <li>Search for "channelId"</li>
              <li>You'll find a string that starts with "UC" followed by 22 characters</li>
              <li>Copy the entire string (it should be 24 characters long)</li>
            </ol>
            <p className="text-gray-600 dark:text-gray-300">
              Alternatively, you can use your channel URL or search for your channel name above.
            </p>
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
            {/* Add channel search */}
            <div>
              <label htmlFor="channelSearch" className="block text-gray-700 dark:text-gray-300 mb-2">
                Search for your YouTube Channel
              </label>
              <div className="relative">
                <input
                  id="channelSearch"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your channel name..."
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                {isSearching && (
                  <div className="absolute right-3 top-2">
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                
                {/* Only show search results if there are results AND user hasn't selected a channel yet */}
                {searchResults.length > 0 && !channelId && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    <ul className="max-h-60 overflow-y-auto">
                      {searchResults.map((channel) => (
                        <li 
                          key={channel.id}
                          onClick={(e: React.MouseEvent<HTMLLIElement>) => {
                            e.stopPropagation();
                            selectChannel(channel);
                          }}
                          className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <img 
                            src={channel.thumbnailUrl} 
                            alt={channel.title} 
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <p className="font-medium dark:text-white">{channel.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{channel.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Start typing your channel name to find your channel
              </p>
            </div>
            
            <div className="flex items-center">
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="mx-4 text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            
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
                onChange={handleChannelIdChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="UC..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your YouTube channel ID directly (starts with "UC")
              </p>
            </div>
            
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                How to find my channel ID?
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
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

      {/* Add this new component before the return statement */}
      <ChannelIdHelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
} 