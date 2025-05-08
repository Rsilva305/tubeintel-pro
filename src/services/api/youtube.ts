import axios from 'axios';
import { Video, Channel, VideoMetadata } from '@/types';
import { YOUTUBE_API_KEY, hasYouTubeApiKey } from '@/lib/env';
import { IYouTubeService } from './interfaces';

// The YouTube API key is now imported from environment variables
const API_KEY = YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Check if API key is properly configured
if (!hasYouTubeApiKey) {
  console.error('YouTube API key is missing or invalid. Please set NEXT_PUBLIC_YOUTUBE_API_KEY in your environment variables.');
  if (process.env.NODE_ENV === 'development') {
    console.info('For local development:');
    console.info('1. Create a .env.local file in your project root');
    console.info('2. Add NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key');
    console.info('3. Restart your development server');
  } else {
    console.info('For production:');
    console.info('1. Add NEXT_PUBLIC_YOUTUBE_API_KEY to your Vercel environment variables');
    console.info('2. Redeploy your application');
  }
}

// Create an axios instance for YouTube API
const youtubeApi = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY
  }
});

// Simple cache implementation
const cache = {
  channels: new Map<string, { data: any, timestamp: number }>(),
  videos: new Map<string, { data: any, timestamp: number }>(),
  // Cache duration set to 4 hours (14400000 ms) to conserve API credits during development
  // This can be adjusted based on needs and API quota availability
  CACHE_DURATION: 4 * 60 * 60 * 1000, // 4 hours in milliseconds

  set(key: string, data: any, type: 'channels' | 'videos') {
    this[type].set(key, {
      data,
      timestamp: Date.now()
    });
  },

  get(key: string, type: 'channels' | 'videos') {
    const item = this[type].get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.CACHE_DURATION) {
      this[type].delete(key);
      return null;
    }
    
    return item.data;
  },

  clear() {
    this.channels.clear();
    this.videos.clear();
  }
};

// Log API key status
console.log('YouTube API Key Status:', {
  isSet: !!API_KEY,
  length: API_KEY?.length,
  prefix: API_KEY?.substring(0, 5),
  suffix: API_KEY?.substring(API_KEY.length - 4)
});

// Add response interceptor to better handle API errors
youtubeApi.interceptors.response.use(
  (response) => {
    console.log('YouTube API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      console.error('YouTube API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        statusText: error.response.statusText,
        data: data?.error || data,
        fullResponse: error.response
      });
      
      if (status === 403) {
        console.error('YouTube API access denied (403). Possible reasons:');
        console.error('- API key is invalid');
        console.error('- API key doesn\'t have YouTube Data API v3 enabled');
        console.error('- API key has domain/IP restrictions');
        console.error('- Daily quota exceeded');
        
        if (data && data.error && data.error.message) {
          console.error('Error details:', data.error.message);
          return Promise.reject(new Error(`YouTube API: ${data.error.message}`));
        }
      }
      
      if (status === 404) {
        console.error('YouTube API resource not found (404)');
        return Promise.reject(new Error('The requested YouTube resource was not found'));
      }
      
      if (status === 429) {
        console.error('YouTube API quota exceeded (429)');
        return Promise.reject(new Error('YouTube API quota has been exceeded for today'));
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from YouTube API', error.request);
      return Promise.reject(new Error('No response from YouTube API. Please check your internet connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up YouTube API request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Function to format a YouTube video to our app's Video type
const formatVideo = (item: any): Video => {
  const { id, snippet, statistics } = item;
  
  return {
    id: id,
    youtubeId: id,
    channelId: snippet.channelId,
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.medium.url,
    publishedAt: new Date(snippet.publishedAt),
    viewCount: parseInt(statistics.viewCount) || 0,
    likeCount: parseInt(statistics.likeCount) || 0,
    commentCount: parseInt(statistics.commentCount) || 0,
    vph: calculateVPH(parseInt(statistics.viewCount), snippet.publishedAt)
  };
};

// Calculate views per hour (simple estimate)
const calculateVPH = (viewCount: number, publishedAt: string): number => {
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursElapsed = Math.max(1, Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60)));
  return Math.round(viewCount / hoursElapsed);
};

// Function to format a YouTube channel to our app's Channel type
const formatChannel = (item: any): Channel => {
  const { id, snippet, statistics } = item;
  
  return {
    id: id,
    youtubeId: id,
    name: snippet.title,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.medium.url,
    subscriberCount: parseInt(statistics.subscriberCount) || 0,
    videoCount: parseInt(statistics.videoCount) || 0,
    viewCount: parseInt(statistics.viewCount) || 0
  };
};

// YouTube API service implementing the interface
export const youtubeService: IYouTubeService = {
  // Test API key to make sure it's working
  testApiKey: async (): Promise<boolean> => {
    try {
      // Make a simple request that uses minimal quota
      await youtubeApi.get('/videos', {
        params: {
          part: 'id',
          chart: 'mostPopular',
          maxResults: 1
        }
      });
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  },
  
  // Channel functions
  getChannelById: async (channelId: string): Promise<Channel> => {
    try {
      // Check cache first
      const cachedChannel = cache.get(channelId, 'channels');
      if (cachedChannel) {
        console.log('Using cached channel data for:', channelId);
        return cachedChannel;
      }

      const response = await youtubeApi.get('/channels', {
        params: {
          part: 'snippet,statistics',
          id: channelId
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const channel = formatChannel(response.data.items[0]);
        // Cache the result
        cache.set(channelId, channel, 'channels');
        return channel;
      }
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },
  
  // New method to get channel ID from username
  getChannelIdByUsername: async (username: string): Promise<string> => {
    try {
      // Check cache first
      const cacheKey = `username:${username}`;
      const cachedId = cache.get(cacheKey, 'channels');
      if (cachedId) {
        console.log('Using cached channel ID for username:', username);
        return cachedId;
      }

      console.log('Getting channel ID for username:', username);
      // Remove @ if present
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // First try with forUsername parameter
      const response = await youtubeApi.get('/channels', {
        params: {
          part: 'id',
          forUsername: cleanUsername
        }
      });

      console.log('Channel lookup response:', response.data);

      if (response.data.items && response.data.items.length > 0) {
        const channelId = response.data.items[0].id;
        console.log('Found channel ID:', channelId);
        // Cache the result
        cache.set(cacheKey, channelId, 'channels');
        return channelId;
      }

      // If no results, try searching
      console.log('No direct match, trying search...');
      const channels = await youtubeService.searchChannels(`@${cleanUsername}`);
      
      if (channels && channels.length > 0) {
        const channelId = channels[0].youtubeId;
        console.log('Found channel ID from search:', channelId);
        // Cache the result
        cache.set(cacheKey, channelId, 'channels');
        return channelId;
      }

      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error getting channel ID:', error);
      throw error;
    }
  },
  
  searchChannels: async (query: string): Promise<Channel[]> => {
    try {
      // Check cache first
      const cacheKey = `search:${query}`;
      const cachedResults = cache.get(cacheKey, 'channels');
      if (cachedResults) {
        console.log('Using cached search results for:', query);
        return cachedResults;
      }

      console.log('Searching channels with query:', query);
      
      // First try to search by channel name
      const response = await youtubeApi.get('/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'channel',
          maxResults: 5
        }
      });

      console.log('Search response:', response.data);

      if (!response.data.items || response.data.items.length === 0) {
        console.log('No search results found');
        return [];
      }

      // Get detailed channel information for each result
      const channelIds = response.data.items.map((item: any) => item.id.channelId).join(',');
      console.log('Fetching details for channel IDs:', channelIds);
      
      const channelsResponse = await youtubeApi.get('/channels', {
        params: {
          part: 'snippet,statistics',
          id: channelIds
        }
      });

      console.log('Channel details response:', channelsResponse.data);

      if (channelsResponse.data.items && channelsResponse.data.items.length > 0) {
        const channels = channelsResponse.data.items.map(formatChannel);
        console.log('Formatted channels:', channels);
        // Cache the results
        cache.set(cacheKey, channels, 'channels');
        return channels;
      }

      console.log('No channel details found');
      return [];
    } catch (error: any) {
      console.error('Error searching channels:', error);
      if (error.response) {
        console.error('YouTube API Response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw error;
    }
  },
  
  // Video functions
  getVideoById: async (videoId: string): Promise<Video> => {
    try {
      // Check cache first
      const cachedVideo = cache.get(videoId, 'videos');
      if (cachedVideo) {
        console.log('Using cached video data for:', videoId);
        return cachedVideo;
      }

      const response = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,statistics',
          id: videoId
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const video = formatVideo(response.data.items[0]);
        // Cache the result
        cache.set(videoId, video, 'videos');
        return video;
      }
      throw new Error('Video not found');
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  },
  
  getVideosByChannelId: async (channelId: string, maxResults = 10): Promise<Video[]> => {
    try {
      // Check cache first
      const cacheKey = `channel:${channelId}:videos:${maxResults}`;
      const cachedVideos = cache.get(cacheKey, 'videos');
      if (cachedVideos) {
        console.log('Using cached videos for channel:', channelId);
        return cachedVideos;
      }

      // First get the video IDs from the channel
      const playlistResponse = await youtubeApi.get('/search', {
        params: {
          part: 'snippet',
          channelId: channelId,
          maxResults: maxResults,
          order: 'date',
          type: 'video'
        }
      });
      
      if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
        return [];
      }
      
      // Extract video IDs
      const videoIds = playlistResponse.data.items.map((item: any) => item.id.videoId).join(',');
      
      // Then get detailed video information
      const videosResponse = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,statistics',
          id: videoIds
        }
      });
      
      if (videosResponse.data.items && videosResponse.data.items.length > 0) {
        const videos = videosResponse.data.items.map(formatVideo);
        // Cache the results
        cache.set(cacheKey, videos, 'videos');
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  },
  
  getTopVideos: async (maxResults = 10): Promise<Video[]> => {
    try {
      // Check cache first
      const cacheKey = `top:${maxResults}`;
      const cachedVideos = cache.get(cacheKey, 'videos');
      if (cachedVideos) {
        console.log('Using cached top videos');
        return cachedVideos;
      }

      // Get popular videos from YouTube
      const response = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode: 'US',
          maxResults: maxResults
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const videos = response.data.items.map(formatVideo);
        // Cache the results
        cache.set(cacheKey, videos, 'videos');
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching top videos:', error);
      throw error;
    }
  },
  
  searchVideos: async (query: string, maxResults = 10): Promise<Video[]> => {
    try {
      // Check cache first
      const cacheKey = `search:${query}:${maxResults}`;
      const cachedVideos = cache.get(cacheKey, 'videos');
      if (cachedVideos) {
        console.log('Using cached search results for:', query);
        return cachedVideos;
      }

      // Search for videos
      const searchResponse = await youtubeApi.get('/search', {
        params: {
          part: 'snippet',
          q: query,
          maxResults: maxResults,
          type: 'video'
        }
      });
      
      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return [];
      }
      
      // Extract video IDs
      const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
      
      // Get detailed video information
      const videosResponse = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,statistics',
          id: videoIds
        }
      });
      
      if (videosResponse.data.items && videosResponse.data.items.length > 0) {
        const videos = videosResponse.data.items.map(formatVideo);
        // Cache the results
        cache.set(cacheKey, videos, 'videos');
        return videos;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },
  
  // Metadata functions
  getVideoMetadata: async (videoId: string): Promise<VideoMetadata> => {
    try {
      const response = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,contentDetails,status,topicDetails',
          id: videoId
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        const item = response.data.items[0];
        const { snippet, contentDetails, status } = item;
        
        return {
          id: videoId,
          videoId: videoId,
          tags: snippet.tags || [],
          category: snippet.categoryId || '',
          language: snippet.defaultLanguage || snippet.defaultAudioLanguage || 'en',
          madeForKids: contentDetails.madeForKids || false,
          privacyStatus: status.privacyStatus || 'public',
          dimension: contentDetails.dimension || '2d',
          definition: contentDetails.definition || 'hd',
          caption: contentDetails.caption === 'true',
          licensedContent: contentDetails.licensedContent || false,
          contentRating: contentDetails.contentRating || {}
        };
      }
      throw new Error('Video metadata not found');
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      throw error;
    }
  }
}; 