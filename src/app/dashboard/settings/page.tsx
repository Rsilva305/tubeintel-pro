'use client';

import { useState, useEffect } from 'react';
import { channelsApi } from '@/services/api';
import { Channel, Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import ProfileDebugger from '@/components/ProfileDebugger';

// Define the search result type
interface ChannelSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: string;
}

export default function SettingsPage() {
  const [channelId, setChannelId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [connectedChannel, setConnectedChannel] = useState<Channel | null>(null);

  // Load current channel on mount
  useEffect(() => {
    const loadChannel = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get channel ID from Supabase with more robust error handling
        let profile = null;
        try {
          // First try with .single()
          const { data: singleProfile, error: singleError } = await supabase
            .from('profiles')
            .select('youtube_channel_id')
            .eq('id', user.id)
            .single<Pick<Profile, 'youtube_channel_id'>>();
          
          if (!singleError) {
            profile = singleProfile;
          } else {
            console.warn('Error with single profile query:', singleError.message);
            
            // If single fails, try to get all profiles for the user
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('youtube_channel_id')
              .eq('id', user.id);
              
            if (profilesError) {
              throw new Error('Failed to load profile: ' + profilesError.message);
            }
            
            // If we have exactly one profile, use it
            if (profiles && profiles.length === 1) {
              profile = profiles[0];
            } else if (profiles && profiles.length > 1) {
              // Multiple profiles found - use the first one with a channel ID
              const profileWithChannel = profiles.find(p => p.youtube_channel_id);
              if (profileWithChannel) {
                profile = profileWithChannel;
                console.warn('Multiple profiles found for user, using the first one with a channel ID');
              } else {
                // No profiles with channel ID, use the first one
                profile = profiles[0];
                console.warn('Multiple profiles found for user, using the first one (no channel ID found)');
              }
            }
            // We don't create a profile here because that's handled by the signup process
          }
        } catch (profileError) {
          console.error('Profile retrieval error:', profileError);
          throw new Error('Failed to load profile: ' + (profileError instanceof Error ? profileError.message : String(profileError)));
        }

        if (profile?.youtube_channel_id) {
          setChannelId(profile.youtube_channel_id as string);
          setIsLoading(true);
          const channel = await channelsApi.getMyChannel();
          setConnectedChannel(channel);
        }
      } catch (error) {
        console.error('Error loading channel:', error);
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Error loading channel. Please reconnect your channel.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChannel();
  }, []);

  const extractChannelId = async (input: string) => {
    try {
      // If it's a direct channel ID (starts with UC and is 24 characters)
      if (input.startsWith('UC') && input.length === 24) {
        return input;
      }

      // If it's a URL, try to parse it
      try {
        const urlObj = new URL(input);
        
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
            const username = urlObj.pathname.substring(2); // Remove the @ symbol
            if (username) {
              const response = await fetch(`/api/youtube/channel?username=${encodeURIComponent(username)}`);
              if (!response.ok) {
                throw new Error('Failed to fetch channel ID');
              }
              const data = await response.json();
              return data.channelId;
            }
          }

          // Format: youtube.com/c/ChannelName
          if (urlObj.pathname.startsWith('/c/')) {
            const customUrl = urlObj.pathname.substring(3); // Remove the c/ prefix
            if (customUrl) {
              const response = await fetch(`/api/youtube/channel?customUrl=${encodeURIComponent(customUrl)}`);
              if (!response.ok) {
                throw new Error('Failed to fetch channel ID');
              }
              const data = await response.json();
              return data.channelId;
            }
          }
        }
      } catch (e) {
        // If it's not a URL, it might be a username
        if (input.startsWith('@')) {
          const username = input.substring(1); // Remove the @ symbol
          const response = await fetch(`/api/youtube/channel?username=${encodeURIComponent(username)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch channel ID');
          }
          const data = await response.json();
          return data.channelId;
        }
      }
      
      throw new Error('Invalid YouTube channel URL or ID');
    } catch (error) {
      console.error('Error extracting channel ID:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId && !searchQuery) {
      setMessage({
        type: 'error',
        text: 'Please search for or enter a YouTube channel'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Extract the channel ID from the input - use channelId directly if already selected from search
      const extractedChannelId = channelId || await extractChannelId(searchQuery);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // TEMPORARY WORKAROUND:
      // First import the profile manager
      const { storeChannelId } = await import('@/lib/profile-manager');
      let updateSucceeded = false;
      
      try {
        // Try to find the profile first to handle possible duplicates
        const { data: profiles, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id);
          
        if (findError) {
          console.warn('Failed to check profile:', findError.message);
        } else {
          let updateError = null;
          
          if (!profiles || profiles.length === 0) {
            // No profile exists, create one
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({ 
                id: user.id,
                email: user.email,
                username: user.email?.split('@')[0] || null,
                youtube_channel_id: extractedChannelId
              });
              
            updateError = insertError;
          } else if (profiles.length === 1) {
            // One profile exists, update it
            const { error: singleUpdateError } = await supabase
              .from('profiles')
              .update({ 
                youtube_channel_id: extractedChannelId
              })
              .eq('id', user.id);
              
            updateError = singleUpdateError;
          } else {
            // Multiple profiles exist, update all of them
            // Note: This is a rare edge case but good to handle
            console.warn(`Found ${profiles.length} profiles for user ${user.id}, updating all`);
            
            for (const profile of profiles) {
              if (!profile || typeof profile.id !== 'string') {
                console.error('Invalid profile object:', profile);
                continue;
              }
              
              const { error: multiUpdateError } = await supabase
                .from('profiles')
                .update({ 
                  youtube_channel_id: extractedChannelId
                })
                .eq('id', profile.id);
                
              if (multiUpdateError) {
                console.error(`Error updating profile ${profile.id}:`, multiUpdateError);
                updateError = multiUpdateError;
                break;
              }
            }
          }
          
          // Check if update was successful
          updateSucceeded = !updateError;
          
          if (updateError) {
            console.warn('Supabase update failed:', updateError.message);
          }
        }
      } catch (error) {
        console.warn('Error during Supabase update attempt:', error);
      }
      
      // If Supabase update failed, use localStorage fallback
      if (!updateSucceeded) {
        // Store in localStorage as a workaround
        await storeChannelId(extractedChannelId as string);
        console.log('Successfully stored channel ID in localStorage as fallback');
      }

      // Fetch channel info to verify and display
      // The channelsApi is already set up to use localStorage as a fallback
      const channel = await channelsApi.getMyChannel();
      setConnectedChannel(channel);
      setChannelId(extractedChannelId); // Update input with the actual channel ID
      
      setMessage({
        type: 'success',
        text: `Successfully connected to channel: ${channel.name}`
      });
    } catch (error: any) {
      console.error('Error connecting channel:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Error connecting to channel. Please check the URL/ID and try again.'
      });
      setConnectedChannel(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new search function
  const searchChannels = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
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
      setMessage({
        type: 'error',
        text: 'Failed to search channels. Please try again.'
      });
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

  // Clear fields
  const clearFields = () => {
    setChannelId('');
    setSearchQuery('');
    setSearchResults([]);
    setMessage(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">YouTube Channel Connection</h2>
        
        {connectedChannel && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Connected Channel</h3>
            <div className="flex items-center">
              {connectedChannel.thumbnailUrl && (
                <img 
                  src={connectedChannel.thumbnailUrl} 
                  alt={connectedChannel.name} 
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-semibold dark:text-white">{connectedChannel.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {connectedChannel.subscriberCount.toLocaleString()} subscribers • 
                  {connectedChannel.videoCount.toLocaleString()} videos
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="channelSearch" className="block text-gray-700 dark:text-gray-300 mb-2">
              Search for your YouTube Channel:
            </label>
            <div className="relative">
              <input
                type="text"
                id="channelSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your channel name..."
              />
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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Search for your YouTube channel by name, or enter a channel URL or ID directly.
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="channelId" className="block text-gray-700 dark:text-gray-300 mb-2">
              Or enter YouTube Channel URL/ID directly:
            </label>
            <input
              type="text"
              id="channelId"
              value={channelId}
              onChange={handleChannelIdChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. https://youtube.com/@username or UC_x5XG1OV2P6uZZ5FSM9Ttw"
            />
          </div>
          
          {message && (
            <div className={`p-3 rounded-md mb-4 ${
              message.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect Channel'}
            </button>
            
            <button
              type="button"
              onClick={clearFields}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Help & Resources</h2>
        <div className="space-y-3 dark:text-gray-300">
          <p>To use TubeIntel Pro effectively:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Connect your YouTube channel using your channel ID</li>
            <li>Add competitor channels on the Competitors page</li>
            <li>Visit the Dashboard regularly to see insights and analytics</li>
          </ol>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            For more help on using YouTube analytics effectively, visit the
            <a 
              href="https://support.google.com/youtube/answer/9002587" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              YouTube Creator Academy
            </a>
          </p>
        </div>
      </div>
      
      {/* Add ProfileDebugger component for troubleshooting */}
      <div className="mt-6 text-center">
        <ProfileDebugger />
      </div>
    </div>
  );
} 