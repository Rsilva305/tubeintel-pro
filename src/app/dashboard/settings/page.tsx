'use client';

import { useState, useEffect } from 'react';
import { channelsApi } from '@/services/api';
import { Channel } from '@/types';
import ApiToggle from '@/components/ApiToggle';

export default function SettingsPage() {
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [connectedChannel, setConnectedChannel] = useState<Channel | null>(null);

  // Load current channel on mount
  useEffect(() => {
    const loadChannel = async () => {
      try {
        const savedChannelId = localStorage.getItem('youtubeChannelId');
        if (savedChannelId) {
          setChannelId(savedChannelId);
          setIsLoading(true);
          const channel = await channelsApi.getMyChannel();
          setConnectedChannel(channel);
        }
      } catch (error) {
        console.error('Error loading channel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) {
      setMessage({
        type: 'error',
        text: 'Please enter a YouTube channel ID'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Store channel ID in localStorage
      localStorage.setItem('youtubeChannelId', channelId);
      
      // Fetch channel info to verify it's valid
      const channel = await channelsApi.getMyChannel();
      setConnectedChannel(channel);
      
      setMessage({
        type: 'success',
        text: `Successfully connected to channel: ${channel.name}`
      });
    } catch (error) {
      console.error('Error connecting channel:', error);
      setMessage({
        type: 'error',
        text: 'Error connecting to channel. Please check the ID and try again.'
      });
      localStorage.removeItem('youtubeChannelId');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">YouTube Channel Connection</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 font-medium">API Mode:</span>
            <ApiToggle />
          </div>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
            Toggle between using real YouTube data or mock data.
            For production use, keep the real YouTube API enabled.
          </p>
        </div>
        
        {connectedChannel && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Connected Channel</h3>
            <div className="flex items-center">
              {connectedChannel.thumbnailUrl && (
                <img 
                  src={connectedChannel.thumbnailUrl} 
                  alt={connectedChannel.name} 
                  className="w-12 h-12 rounded-full mr-3"
                />
              )}
              <div>
                <p className="font-semibold">{connectedChannel.name}</p>
                <p className="text-sm text-gray-600">
                  {connectedChannel.subscriberCount.toLocaleString()} subscribers • 
                  {connectedChannel.videoCount.toLocaleString()} videos
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="channelId" className="block text-gray-700 mb-2">
              YouTube Channel ID:
            </label>
            <input
              type="text"
              id="channelId"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
            />
            <p className="mt-1 text-sm text-gray-500">
              Find your channel ID by going to your YouTube channel page and looking at the URL. It's usually in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
            </p>
          </div>
          
          {message && (
            <div className={`p-3 rounded-md mb-4 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Help & Resources</h2>
        <div className="space-y-3">
          <p>To use TubeIntel Pro effectively:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Connect your YouTube channel using your channel ID</li>
            <li>Add competitor channels on the Competitors page</li>
            <li>Visit the Dashboard regularly to see insights and analytics</li>
          </ol>
          <p className="mt-3 text-sm text-gray-600">
            For more help on using YouTube analytics effectively, visit the
            <a 
              href="https://support.google.com/youtube/answer/9002587" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              YouTube Creator Academy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 