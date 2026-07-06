import axios from 'axios';
import { Video, Channel, VideoMetadata } from '@/types';
import { YOUTUBE_API_KEY } from '@/lib/env';

// The YouTube API key is now imported from environment variables
const API_KEY = YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Log if API key is missing or incomplete
if (!API_KEY || API_KEY.length < 20) {
  console.warn('YouTube API key is missing or appears to be invalid. API calls will likely fail.');
}

// Create an axios instance for YouTube API
const youtubeApi = axios.create({
  baseURL: BASE_URL,
  params: {
    key: API_KEY
  }
});

// Add response interceptor to better handle API errors
youtubeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
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

// YouTube API service with functions that match our mock API structure
export const youtubeService = {
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
      const response = await youtubeApi.get('/channels', {
        params: {
          part: 'snippet,statistics',
          id: channelId
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return formatChannel(response.data.items[0]);
      }
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },
  
  // Video functions
  getVideoById: async (videoId: string): Promise<Video> => {
    try {
      const response = await youtubeApi.get('/videos', {
        params: {
          part: 'snippet,statistics',
          id: videoId
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return formatVideo(response.data.items[0]);
      }
      throw new Error('Video not found');
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  },
  
  getVideosByChannelId: async (channelId: string, maxResults = 10): Promise<Video[]> => {
    try {
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
        return videosResponse.data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  },
  
  getTopVideos: async (maxResults = 10): Promise<Video[]> => {
    try {
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
        return response.data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching top videos:', error);
      throw error;
    }
  },
  
  searchVideos: async (query: string, maxResults = 10): Promise<Video[]> => {
    try {
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
        return videosResponse.data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },
  
  // Additional functions for other features
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
  },
  
  getVideoComments: async (videoId: string, maxResults = 20) => {
    try {
      const response = await youtubeApi.get('/commentThreads', {
        params: {
          part: 'snippet',
          videoId: videoId,
          maxResults: maxResults
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return response.data.items.map((item: any) => {
          const comment = item.snippet.topLevelComment.snippet;
          return {
            id: item.id,
            authorDisplayName: comment.authorDisplayName,
            authorProfileImageUrl: comment.authorProfileImageUrl,
            textDisplay: comment.textDisplay,
            likeCount: comment.likeCount,
            publishedAt: comment.publishedAt
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching video comments:', error);
      throw error;
    }
  }
}; 