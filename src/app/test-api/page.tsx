'use client';

import { useState, useEffect } from 'react';
import { youtubeService } from '@/services/api/youtube';
import { channelsApi, videosApi } from '@/services/api';
import { Video, Channel } from '@/types';
import ApiToggle from '@/components/ApiToggle';
import Link from 'next/link';
import { getUseRealApi } from '@/services/api/config';

export default function TestAPIPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [useRealApi, setUseRealApi] = useState<boolean | undefined>(undefined);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  useEffect(() => {
    setUseRealApi(getUseRealApi());
    setIsClientInitialized(true);
  }, []);

  const fetchData = async () => {
    if (!isClientInitialized) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const channelData = await channelsApi.getMyChannel();
      setChannel(channelData);
      
      const videosData = await videosApi.getRecentVideos(5);
      setVideos(videosData);
    } catch (err) {
      console.error('API Test Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClientInitialized) {
      fetchData();
    }
  }, [useRealApi, isClientInitialized]);

  const handleApiToggle = (newUseRealApi: boolean) => {
    setUseRealApi(newUseRealApi);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">YouTube API Integration Test</h1>
        <div className="flex items-center">
          <ApiToggle onToggle={handleApiToggle} />
          <Link href="/dashboard" className="ml-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700 dark:text-blue-300">
          This page demonstrates the integration with the YouTube API. 
          Toggle between mock data and real YouTube API data.
          <br />
          {isClientInitialized ? (
            <strong>Current Mode: {useRealApi ? 'Real YouTube API' : 'Mock Data'}</strong>
          ) : (
            <strong className="bg-gray-200 dark:bg-gray-700 animate-pulse inline-block h-5 w-28 rounded"></strong>
          )}
        </p>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-500 dark:text-gray-400">
            {isClientInitialized 
              ? `Loading data from ${useRealApi ? 'YouTube API' : 'mock data'}...`
              : 'Initializing...'}
          </p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          {isClientInitialized && (
            <p className="mt-2">
              {useRealApi 
                ? 'Make sure your API key is correct and has the YouTube Data API v3 enabled.' 
                : 'There was an error loading the mock data.'}
            </p>
          )}
        </div>
      )}
      
      {channel && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Channel Data</h2>
          <div className="flex items-center">
            {channel.thumbnailUrl && (
              <img 
                src={channel.thumbnailUrl} 
                alt={channel.name} 
                className="w-16 h-16 rounded-full mr-4"
              />
            )}
            <div>
              <p className="font-bold dark:text-white">{channel.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{channel.description?.substring(0, 100)}...</p>
              <div className="flex mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p className="mr-4">{channel.subscriberCount.toLocaleString()} subscribers</p>
                <p>{channel.videoCount.toLocaleString()} videos</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {videos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Recent Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <div key={video.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                {video.thumbnailUrl && (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-40 object-cover mb-2 rounded"
                  />
                )}
                <h3 className="font-bold truncate dark:text-white">{video.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 h-12 overflow-hidden">
                  {video.description?.substring(0, 100)}...
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>{video.viewCount.toLocaleString()} views</p>
                  <p>Published: {video.publishedAt.toLocaleDateString()}</p>
                  <p>VPH: {video.vph}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 