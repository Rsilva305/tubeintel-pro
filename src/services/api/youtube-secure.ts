import { Video, Channel, VideoMetadata } from '@/types';
import { IYouTubeService } from './interfaces';

// Helper function to get the base URL for API calls
const getBaseUrl = (): string => {
  // Check if we're on the server side
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default to localhost
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    
    // For local development, use the port from environment or default to 3000
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  // Client-side: use relative URLs
  return '';
};

// Format a YouTube video API response to our app's Video type
const formatVideo = (item: any): Video => {
  const { id, snippet, statistics = {}, contentDetails = {} } = item;
  
  // Parse ISO 8601 duration format (PT4M13S) to seconds
  const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  };
  
  return {
    id: id,
    youtubeId: id,
    channelId: snippet.channelId,
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl: snippet.thumbnails.medium.url,
    publishedAt: new Date(snippet.publishedAt),
    viewCount: parseInt(statistics.viewCount || '0'),
    likeCount: parseInt(statistics.likeCount || '0'),
    commentCount: parseInt(statistics.commentCount || '0'),
    vph: calculateVPH(parseInt(statistics.viewCount || '0'), snippet.publishedAt),
    duration: parseDuration(contentDetails.duration)
  };
};

// Calculate Views Per Hour (VPH)
function calculateVPH(viewCount: number, publishedAt: string): number {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const hoursSincePublished = Math.max((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60), 1);
  return Math.round(viewCount / hoursSincePublished);
}

// Format a YouTube channel API response to our app's Channel type
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

// YouTube API service implementation using server-side API routes
export const secureYoutubeService: IYouTubeService = {
  // Test API key to make sure it's working
  testApiKey: async (): Promise<boolean> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/videos?maxResults=1`);
      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  },
  
  // Channel functions
  getChannelById: async (channelId: string): Promise<Channel> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/channels?id=${channelId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return formatChannel(data.items[0]);
      }
      
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error fetching channel:', error);
      throw error;
    }
  },
  
  getChannelIdByUsername: async (username: string): Promise<string> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/channels?username=${username}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel by username: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0].id;
      }
      
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error getting channel ID:', error);
      throw error;
    }
  },
  
  searchChannels: async (query: string): Promise<Channel[]> => {
    try {
      const baseUrl = getBaseUrl();
      const searchParams = new URLSearchParams({
        q: query,
        type: 'channel',
        maxResults: '5'
      });
      
      const response = await fetch(`${baseUrl}/api/youtube/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search channels: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }
      
      // Get channel IDs
      const channelIds = data.items
        .map((item: any) => item.id.channelId)
        .join(',');
      
      // Get detailed channel information
      const channelsResponse = await fetch(`${baseUrl}/api/youtube/channels?id=${channelIds}`);
      
      if (!channelsResponse.ok) {
        throw new Error(`Failed to fetch channel details: ${channelsResponse.statusText}`);
      }
      
      const channelsData = await channelsResponse.json();
      
      if (channelsData.items && channelsData.items.length > 0) {
        return channelsData.items.map(formatChannel);
      }
      
      return [];
    } catch (error) {
      console.error('Error searching channels:', error);
      throw error;
    }
  },
  
  // Video functions
  getVideoById: async (videoId: string): Promise<Video> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/videos?id=${videoId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return formatVideo(data.items[0]);
      }
      
      throw new Error('Video not found');
    } catch (error) {
      console.error('Error fetching video:', error);
      throw error;
    }
  },
  
  getVideosByChannelId: async (channelId: string, maxResults = 20): Promise<Video[]> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/videos?channelId=${channelId}&maxResults=${maxResults}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channel videos: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  },

  // NEW: Fetch ALL videos from a channel with pagination
  getAllVideosByChannelId: async (
    channelId: string, 
    onProgress?: (current: number, total?: number) => void
  ): Promise<Video[]> => {
    try {
      console.log(`🚀 Starting to fetch ALL videos for channel: ${channelId}`);
      
      const baseUrl = getBaseUrl();
      const allVideos: Video[] = [];
      let pageToken: string | undefined = undefined;
      let pageNumber = 1;
      const maxResultsPerPage = 50; // YouTube API maximum per request
      let totalVideoCount: number | undefined = undefined;

      // First, get the channel info to know total video count
      try {
        const channelInfo = await secureYoutubeService.getChannelById(channelId);
        totalVideoCount = channelInfo.videoCount;
        console.log(`📊 Channel has approximately ${totalVideoCount} total videos`);
        
        if (onProgress) {
          onProgress(0, totalVideoCount);
        }
      } catch (error) {
        console.warn('Could not fetch channel info for video count estimate:', error);
      }

      do {
        try {
          console.log(`📄 Fetching page ${pageNumber} (up to ${maxResultsPerPage} videos)...`);
          
          // Build URL with pagination
          const params = new URLSearchParams({
            channelId,
            maxResults: maxResultsPerPage.toString()
          });
          
          if (pageToken) {
            params.append('pageToken', pageToken);
          }
          
          const response = await fetch(`${baseUrl}/api/youtube/videos?${params}`);
          
          if (!response.ok) {
            if (response.status === 429) {
              console.warn(`⚠️ Rate limited on page ${pageNumber}, waiting before retry...`);
              // Wait 5 seconds before retry
              await new Promise(resolve => setTimeout(resolve, 5000));
              continue; // Retry the same page
            }
            throw new Error(`Failed to fetch page ${pageNumber}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const pageVideos = data.items.map(formatVideo);
            allVideos.push(...pageVideos);
            
            console.log(`✅ Page ${pageNumber}: Got ${pageVideos.length} videos (Total so far: ${allVideos.length})`);
            
            // Call progress callback
            if (onProgress) {
              onProgress(allVideos.length, totalVideoCount);
            }
          } else {
            console.log(`📄 Page ${pageNumber}: No videos found`);
          }
          
          // Check if there are more pages
          pageToken = data.nextPageToken;
          pageNumber++;
          
          // Rate limiting: wait between requests to avoid hitting limits
          if (pageToken) {
            console.log(`⏳ Waiting 2 seconds before next page...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          console.error(`❌ Error fetching page ${pageNumber}:`, error);
          
          // If we have some videos, return what we have
          if (allVideos.length > 0) {
            console.log(`⚠️ Stopping pagination due to error, but returning ${allVideos.length} videos collected so far`);
            break;
          } else {
            throw error;
          }
        }
        
      } while (pageToken);

      console.log(`🎉 Completed! Fetched ${allVideos.length} total videos for channel ${channelId}`);
      
      // Sort by published date (newest first)
      const sortedVideos = allVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      return sortedVideos;
      
    } catch (error) {
      console.error('Error fetching all channel videos:', error);
      throw error;
    }
  },
  
  getTopVideos: async (maxResults = 10): Promise<Video[]> => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/videos?maxResults=${maxResults}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top videos: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching top videos:', error);
      throw error;
    }
  },
  
  searchVideos: async (query: string, maxResults = 10): Promise<Video[]> => {
    try {
      const baseUrl = getBaseUrl();
      const searchParams = new URLSearchParams({
        q: query,
        type: 'video',
        maxResults: maxResults.toString()
      });
      
      const searchResponse = await fetch(`${baseUrl}/api/youtube/search?${searchParams}`);
      
      if (!searchResponse.ok) {
        throw new Error(`Failed to search videos: ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }
      
      // Extract video IDs
      const videoIds = searchData.items
        .map((item: any) => item.id.videoId)
        .join(',');
      
      // Get detailed video information
      const videoResponse = await fetch(`${baseUrl}/api/youtube/videos?id=${videoIds}`);
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video details: ${videoResponse.statusText}`);
      }
      
      const videoData = await videoResponse.json();
      
      if (videoData.items && videoData.items.length > 0) {
        return videoData.items.map(formatVideo);
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/youtube/videos?id=${videoId}&part=snippet,contentDetails,status,topicDetails`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
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
  
  getRecentVideosByChannelId: async (channelId: string, publishedAfter: Date, maxResults = 20): Promise<Video[]> => {
    try {
      const baseUrl = getBaseUrl();
      // Build search parameters to only get videos after the specified date
      const searchParams = new URLSearchParams({
        channelId,
        maxResults: maxResults.toString(),
        order: 'date',
        publishedAfter: publishedAfter.toISOString()
      });
      
      const response = await fetch(`${baseUrl}/api/youtube/videos/recent?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent channel videos: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items.map(formatVideo);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching recent channel videos:', error);
      throw error;
    }
  },
}; 