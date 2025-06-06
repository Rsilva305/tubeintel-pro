import { User, Channel, Video, Alert, Competitor, Transcript, VideoMetadata, Insight, Profile } from '@/types';
import { 
  mockUsers, 
  mockChannels, 
  mockVideos, 
  mockAlerts, 
  mockCompetitors, 
  mockTranscripts, 
  mockMetadata,
  mockInsights 
} from './mockData';
import { secureYoutubeService as youtubeApiService } from './youtube-secure';
import { competitorListsApi } from './competitorLists';
import { getCachedChannelId, getChannelWithCache, getChannelIdForVideos } from './optimized-channels';
import { getCurrentUser } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '../subscription-optimized';
import { supabaseService } from '../supabase-optimized';
import { apiCache, createCacheKey } from '@/lib/api-cache';

// Users API - Optimized with caching
const usersApi = {
  getCurrentUser: async (): Promise<User | null> => {
    const cacheKey = 'current_user';
    
    return apiCache.get(
      cacheKey,
      async () => {
        const user = await getCurrentUser();
        if (!user) return null;
        
        // Convert Supabase user to our User type
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || '',
          avatar: user.user_metadata?.avatar_url || ''
        };
      },
      'profile'
    );
  },
  
  getUserById: async (id: string): Promise<User | null> => {
    const cacheKey = createCacheKey('user', id);
    
    return apiCache.get(
      cacheKey,
      async () => {
        // Get user profile from optimized Supabase service
        const profile = await supabaseService.getUserProfile(id);
        if (!profile) return null;
        
        return {
          id: profile.id,
          email: profile.email || '',
          name: profile.name || profile.email || '',
          avatar: profile.avatar_url || ''
        };
      },
      'profile'
    );
  }
};

// Optimized Channels API - Uses our new caching layer
const channelsApi = {
  getMyChannel: async (): Promise<Channel> => {
    // Use the optimized channel function that caches intelligently
    return getOptimizedChannel();
  },
  
  getChannelById: async (id: string): Promise<Channel | null> => {
    const cacheKey = createCacheKey('youtube_channel', id);
    
    return apiCache.get(
      cacheKey,
      () => youtubeApiService.getChannelById(id),
      'youtube_channel'
    );
  },
  
  searchChannels: async (query: string): Promise<Channel[]> => {
    const cacheKey = createCacheKey('channel_search', query);
    
    return apiCache.get(
      cacheKey,
      () => youtubeApiService.searchChannels(query),
      'youtube_channel'
    );
  }
};

// Optimized Videos API - Uses cached channel ID
const videosApi = {
  getAllVideos: async (): Promise<Video[]> => {
    const cacheKey = 'user_all_videos';
    
    return apiCache.get(
      cacheKey,
      async () => {
        try {
          // Get channel ID directly (cached) instead of full channel data
          const channelId = await getChannelIdForVideos();
          return await youtubeApiService.getVideosByChannelId(channelId);
        } catch (error) {
          console.error('Error fetching videos from YouTube API:', error);
          return mockVideos; // Fallback to mock data
        }
      },
      'youtube_videos'
    );
  },
  
  getVideoById: async (id: string): Promise<Video | null> => {
    const cacheKey = createCacheKey('youtube_video', id);
    
    return apiCache.get(
      cacheKey,
      async () => {
        try {
          return await youtubeApiService.getVideoById(id);
        } catch (error) {
          console.error('Error fetching video from YouTube API:', error);
          return mockVideos.find(video => video.id === id) || null;
        }
      },
      'youtube_videos'
    );
  },
  
  getRecentVideos: async (limit: number = 5): Promise<Video[]> => {
    const cacheKey = createCacheKey('user_recent_videos', limit);
    
    return apiCache.get(
      cacheKey,
      async () => {
        try {
          // Get channel ID directly (cached) instead of full channel data
          const channelId = await getChannelIdForVideos();
          const videos = await youtubeApiService.getVideosByChannelId(channelId, limit);
          return videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        } catch (error) {
          console.error('Error fetching recent videos from YouTube API:', error);
          // Fallback to mock data
          return mockVideos
            .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
            .slice(0, limit);
        }
      },
      'youtube_videos'
    );
  },
  
  getTopPerformingVideos: async (limit: number = 5): Promise<Video[]> => {
    const cacheKey = createCacheKey('top_videos', limit);
    
    return apiCache.get(
      cacheKey,
      async () => {
        try {
          // Get trending videos
          return await youtubeApiService.getTopVideos(limit);
        } catch (error) {
          console.error('Error fetching top videos from YouTube API:', error);
          // Fallback to mock data
          return mockVideos.sort((a, b) => b.vph - a.vph).slice(0, limit);
        }
      },
      'youtube_videos'
    );
  }
};

// Alerts API - Simple caching since it's mock data
const alertsApi = {
  getAllAlerts: async (): Promise<Alert[]> => {
    const cacheKey = 'all_alerts';
    return apiCache.get(cacheKey, () => Promise.resolve(mockAlerts), 'default');
  },
  
  getUnreadAlerts: async (): Promise<Alert[]> => {
    const cacheKey = 'unread_alerts';
    return apiCache.get(
      cacheKey, 
      () => Promise.resolve(mockAlerts.filter(alert => !alert.read)),
      'default'
    );
  },
  
  markAlertAsRead: async (alertId: string): Promise<Alert> => {
    // Invalidate caches when marking as read
    apiCache.invalidate('alerts');
    
    const alert = mockAlerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, read: true };
  },
  
  createAlert: async (data: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<Alert> => {
    // Invalidate caches when creating
    apiCache.invalidate('alerts');
    
    return {
      id: `${mockAlerts.length + 1}`,
      ...data,
      createdAt: new Date(),
      read: false
    };
  }
};

// Optimized Competitors API
const competitorsApi = {
  getAllCompetitors: async (): Promise<Competitor[]> => {
    const cacheKey = 'all_competitors';
    
    return apiCache.get(
      cacheKey,
      () => Promise.resolve(mockCompetitors),
      'competitors'
    );
  },
  
  getCompetitorById: async (id: string): Promise<Competitor | null> => {
    const cacheKey = createCacheKey('competitor', id);
    
    return apiCache.get(
      cacheKey,
      () => Promise.resolve(mockCompetitors.find(competitor => competitor.id === id) || null),
      'competitors'
    );
  },
  
  addCompetitor: async (data: Omit<Competitor, 'id'>): Promise<Competitor> => {
    try {
      // Get actual channel data from YouTube
      const channelData = await youtubeApiService.getChannelById(data.youtubeId);
      
      // Invalidate competitor caches
      apiCache.invalidate('competitor');
      
      // Use the data from YouTube API but keep our app's ID system
      return {
        id: `${mockCompetitors.length + 1}`,
        youtubeId: channelData.youtubeId,
        name: channelData.name,
        thumbnailUrl: channelData.thumbnailUrl,
        subscriberCount: channelData.subscriberCount,
        videoCount: channelData.videoCount,
        viewCount: channelData.viewCount
      };
    } catch (error) {
      console.error('Error adding competitor from YouTube API:', error);
      
      // Invalidate competitor caches
      apiCache.invalidate('competitor');
      
      // Fallback if API fails
      return {
        id: `${mockCompetitors.length + 1}`,
        ...data
      };
    }
  },
  
  removeCompetitor: async (id: string): Promise<void> => {
    // Invalidate competitor caches
    apiCache.invalidate('competitor');
    return;
  }
};

// Transcripts API - with caching
const transcriptsApi = {
  getVideoTranscript: async (videoId: string): Promise<Transcript | null> => {
    const cacheKey = createCacheKey('transcript', videoId);
    
    return apiCache.get(
      cacheKey,
      () => Promise.resolve(mockTranscripts.find(t => t.videoId === videoId) || null),
      'default'
    );
  }
};

// Metadata API - with caching
const metadataApi = {
  getVideoMetadata: async (videoId: string): Promise<VideoMetadata | null> => {
    const cacheKey = createCacheKey('metadata', videoId);
    
    return apiCache.get(
      cacheKey,
      async () => {
        try {
          return await youtubeApiService.getVideoMetadata(videoId);
        } catch (error) {
          console.error('Error fetching video metadata:', error);
          return mockMetadata.find(m => m.videoId === videoId) || null;
        }
      },
      'youtube_videos'
    );
  }
};

// Insights API - with caching
const insightsApi = {
  getAllInsights: async (): Promise<Insight[]> => {
    const cacheKey = 'all_insights';
    
    return apiCache.get(
      cacheKey,
      () => Promise.resolve(mockInsights),
      'default'
    );
  }
};

// Profile API - Uses optimized Supabase service
const profileApi = {
  getCurrentUserProfile: async (): Promise<Profile | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    
    try {
      return await supabaseService.getUserProfile(user.id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  updateProfile: async (profileData: Partial<Profile>): Promise<Profile> => {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate profile cache
    apiCache.invalidate(`profile:${user.id}`);
    
    return data;
  }
};

// Re-export the competitor lists API as-is (it's already optimized)
export { competitorListsApi };

// Export all APIs
export {
  usersApi,
  channelsApi,
  videosApi,
  alertsApi,
  competitorsApi,
  transcriptsApi,
  metadataApi,
  insightsApi,
  profileApi,
  subscriptionService as subscriptionApi,
  apiCache
}; 