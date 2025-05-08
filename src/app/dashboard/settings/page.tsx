'use client';

import { useState, useEffect } from 'react';
import { channelsApi } from '@/services/api';
import { Channel, Profile } from '@/types';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

export default function SettingsPage() {
  const [channelId, setChannelId] = useState('');
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

        // Get channel ID from Supabase
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('youtube_channel_id')
          .eq('id', user.id)
          .single<Pick<Profile, 'youtube_channel_id'>>();

        if (error) {
          throw new Error('Failed to load profile: ' + error.message);
        }

        if (profile?.youtube_channel_id) {
          setChannelId(profile.youtube_channel_id);
          setIsLoading(true);
          const channel = await channelsApi.getMyChannel();
          setConnectedChannel(channel);
        }
      } catch (error) {
        console.error('Error loading channel:', error);
        setMessage({
          type: 'error',
          text: 'Error loading channel. Please reconnect your channel.'
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
    if (!channelId) {
      setMessage({
        type: 'error',
        text: 'Please enter a YouTube channel URL or ID'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Extract the channel ID from the input
      const extractedChannelId = await extractChannelId(channelId);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          youtube_channel_id: extractedChannelId
        })
        .eq('id', user.id);
        
      if (updateError) {
        throw new Error('Failed to update profile: ' + updateError.message);
      }

      // Fetch channel info to verify and display
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
            <label htmlFor="channelId" className="block text-gray-700 dark:text-gray-300 mb-2">
              YouTube Channel URL or ID:
            </label>
            <input
              type="text"
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. https://youtube.com/@username or UC_x5XG1OV2P6uZZ5FSM9Ttw"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter your YouTube channel URL (e.g., https://youtube.com/@username) or channel ID.
            </p>
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
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect Channel'}
          </button>
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
    </div>
  );
} 