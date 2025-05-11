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
import { youtubeService } from './youtube';
import { secureYoutubeService } from './youtube-secure';
import { competitorListsApi } from './competitorLists';
import { getCurrentUser } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Use the secure YouTube service by default, fall back to direct API calls if needed
// This allows for a smooth transition to the secure API
const youtubeApiService = secureYoutubeService;

// Auth API
const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    // For demo purposes, always return successful login with mock user
    if (username && password) {
      return mockUsers[0];
    }
    throw new Error('Invalid credentials');
  },
  
  logout: async (): Promise<void> => {
    // Simulated logout
    return;
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    // For demo purposes, always return the mock user
    return mockUsers[0];
  }
};

// Channels API
const channelsApi = {
  getMyChannel: async (): Promise<Channel> => {
    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, try to get the channel ID from localStorage as a fallback
      let channelId = null;
      if (typeof window !== 'undefined') {
        channelId = localStorage.getItem('youtubeChannelId');
      }

      // If we didn't find it in localStorage, try to get it from Supabase
      if (!channelId) {
        try {
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
              } else {
                // No profiles found, create one
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    email: user.email,
                    username: user.email?.split('@')[0] || null
                  })
                  .select()
                  .single();
                  
                if (insertError) {
                  throw new Error('Failed to create profile: ' + insertError.message);
                }
                
                profile = newProfile;
                console.log('Created new profile for user');
              }
            }
          } catch (profileError) {
            console.error('Profile retrieval error:', profileError);
            // Don't throw here, we'll check localStorage next
          }

          // If we found a profile with a channel ID, use that
          if (profile?.youtube_channel_id) {
            channelId = profile.youtube_channel_id as string; // Type assertion to fix linter error
            
            // Also store it in localStorage for future use
            if (typeof window !== 'undefined') {
              localStorage.setItem('youtubeChannelId', channelId);
            }
          }
        } catch (error) {
          console.error('Error fetching channel ID from Supabase:', error);
          // Continue to try localStorage or default as a fallback
        }
      }

      // If we still don't have a channel ID, throw an error
      if (!channelId) {
        throw new Error('No channel ID found. Please connect your YouTube channel first.');
      }
      
      // Get channel info from the YouTube API
      return await youtubeApiService.getChannelById(channelId);
    } catch (error) {
      console.error('Error fetching channel from YouTube API:', error);
      throw error;
    }
  },
  
  updateChannel: async (channelId: string, data: Partial<Channel>): Promise<Channel> => {
    try {
      // Validate the channel exists
      const channel = await youtubeApiService.getChannelById(channelId);
      return { ...channel, ...data };
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }
};

// Videos API
const videosApi = {
  getAllVideos: async (): Promise<Video[]> => {
    try {
      // Get channel first
      const channel = await channelsApi.getMyChannel();
      // Then get videos for that channel
      return await youtubeApiService.getVideosByChannelId(channel.youtubeId);
    } catch (error) {
      console.error('Error fetching videos from YouTube API:', error);
      return mockVideos; // Fallback to mock data
    }
  },
  
  getVideoById: async (id: string): Promise<Video | null> => {
    try {
      return await youtubeApiService.getVideoById(id);
    } catch (error) {
      console.error('Error fetching video from YouTube API:', error);
      return mockVideos.find(video => video.id === id) || null; // Fallback to mock data
    }
  },
  
  getRecentVideos: async (limit: number = 5): Promise<Video[]> => {
    try {
      const channel = await channelsApi.getMyChannel();
      const videos = await youtubeApiService.getVideosByChannelId(channel.youtubeId, limit);
      return videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    } catch (error) {
      console.error('Error fetching recent videos from YouTube API:', error);
      // Fallback to mock data
      return mockVideos
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit);
    }
  },
  
  getTopPerformingVideos: async (limit: number = 5): Promise<Video[]> => {
    try {
      // Get trending videos
      return await youtubeApiService.getTopVideos(limit);
    } catch (error) {
      console.error('Error fetching top videos from YouTube API:', error);
      // Fallback to mock data
      return mockVideos.sort((a, b) => b.vph - a.vph).slice(0, limit);
    }
  }
};

// Alerts API
const alertsApi = {
  getAllAlerts: async (): Promise<Alert[]> => {
    return mockAlerts;
  },
  
  getUnreadAlerts: async (): Promise<Alert[]> => {
    return mockAlerts.filter(alert => !alert.read);
  },
  
  markAlertAsRead: async (alertId: string): Promise<Alert> => {
    const alert = mockAlerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, read: true };
  },
  
  createAlert: async (data: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<Alert> => {
    return {
      id: `${mockAlerts.length + 1}`,
      ...data,
      createdAt: new Date(),
      read: false
    };
  }
};

// Competitors API
const competitorsApi = {
  getAllCompetitors: async (): Promise<Competitor[]> => {
    return mockCompetitors;
  },
  
  getCompetitorById: async (id: string): Promise<Competitor | null> => {
    return mockCompetitors.find(competitor => competitor.id === id) || null;
  },
  
  addCompetitor: async (data: Omit<Competitor, 'id'>): Promise<Competitor> => {
    try {
      // Get actual channel data from YouTube
      const channelData = await youtubeApiService.getChannelById(data.youtubeId);
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
      // Fallback if API fails
      return {
        id: `${mockCompetitors.length + 1}`,
        ...data
      };
    }
  },
  
  removeCompetitor: async (id: string): Promise<void> => {
    // In a real app, we would remove the competitor
    return;
  }
};

// Transcripts API
const transcriptsApi = {
  getTranscriptForVideo: async (videoId: string): Promise<Transcript | null> => {
    return mockTranscripts.find(transcript => transcript.videoId === videoId) || null;
  }
};

// Metadata API
const metadataApi = {
  getMetadataForVideo: async (videoId: string): Promise<VideoMetadata | null> => {
    try {
      return await youtubeApiService.getVideoMetadata(videoId);
    } catch (error) {
      console.error('Error fetching video metadata from YouTube API:', error);
      return mockMetadata.find(metadata => metadata.videoId === videoId) || null;
    }
  }
};

// Insights API
const insightsApi = {
  getInsightsForVideo: async (videoId: string): Promise<Insight | null> => {
    // Currently insights are only available in mock data
    return mockInsights.find(insight => insight.videoId === videoId) || null;
  },
  
  getInsightsForChannel: async (channelId: string): Promise<Insight[]> => {
    // Get insights related to a specific channel
    return mockInsights.filter(insight => insight.channelId === channelId);
  },
  
  generateInsight: async (videoId: string, type: string): Promise<Insight> => {
    // In a real app, this would analyze data and generate an insight
    return {
      id: `${mockInsights.length + 1}`,
      videoId,
      channelId: '1', // Assuming for the demo
      type: type as any,
      summary: 'Auto-generated insight based on recent performance metrics.',
      details: {
        strengths: ['Generated strength 1', 'Generated strength 2'],
        improvements: ['Generated improvement 1', 'Generated improvement 2'],
        trends: ['Generated trend 1', 'Generated trend 2']
      },
      createdAt: new Date()
    };
  }
};

// Export all APIs together (ensures no duplicate exports)
export { 
  authApi,
  channelsApi,
  videosApi,
  alertsApi,
  competitorsApi,
  transcriptsApi,
  metadataApi,
  insightsApi,
  competitorListsApi
}; 