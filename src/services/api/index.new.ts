import { User, Channel, Video, Alert, Competitor, Transcript, VideoMetadata, Insight } from '@/types';
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
import { getUseRealApi, simulateDelay as apiDelay } from './config';

// Import competitorListsApi
import { competitorListsApi } from './competitorLists';

// Simulated API delay
const simulateDelay = apiDelay;

// Auth API
const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    await simulateDelay();
    // For demo purposes, always return successful login with mock user
    if (username && password) {
      return mockUsers[0];
    }
    throw new Error('Invalid credentials');
  },
  
  logout: async (): Promise<void> => {
    await simulateDelay();
    // Simulated logout
    return;
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    await simulateDelay();
    // For demo purposes, always return the mock user
    return mockUsers[0];
  }
};

// Channels API
const channelsApi = {
  getMyChannel: async (): Promise<Channel> => {
    if (getUseRealApi()) {
      try {
        // Get the user's specified channel ID from localStorage
        let channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Default to Google Developers channel
        
        // In browser environment, try to get the user's specified channel
        if (typeof window !== 'undefined') {
          const userChannelId = localStorage.getItem('youtubeChannelId');
          if (userChannelId) {
            channelId = userChannelId;
          }
        }
        
        return await youtubeService.getChannelById(channelId);
      } catch (error) {
        console.error('Error fetching channel from YouTube API:', error);
        throw error;
      }
    } else {
      await simulateDelay();
      return mockChannels[0];
    }
  },
  
  updateChannel: async (channelId: string, data: Partial<Channel>): Promise<Channel> => {
    await simulateDelay();
    // Return updated channel for demo
    return { ...mockChannels[0], ...data };
  }
};

// Videos API
const videosApi = {
  getAllVideos: async (): Promise<Video[]> => {
    if (getUseRealApi()) {
      try {
        // Get channel first
        const channel = await channelsApi.getMyChannel();
        // Then get videos for that channel
        return await youtubeService.getVideosByChannelId(channel.youtubeId);
      } catch (error) {
        console.error('Error fetching videos from YouTube API:', error);
        throw error;
      }
    } else {
      await simulateDelay();
      return mockVideos;
    }
  },
  
  getVideoById: async (id: string): Promise<Video | null> => {
    if (getUseRealApi()) {
      try {
        return await youtubeService.getVideoById(id);
      } catch (error) {
        console.error('Error fetching video from YouTube API:', error);
        return null;
      }
    } else {
      await simulateDelay();
      return mockVideos.find(video => video.id === id) || null;
    }
  },
  
  getRecentVideos: async (limit: number = 5): Promise<Video[]> => {
    if (getUseRealApi()) {
      try {
        const channel = await channelsApi.getMyChannel();
        const videos = await youtubeService.getVideosByChannelId(channel.youtubeId, limit);
        return videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      } catch (error) {
        console.error('Error fetching recent videos from YouTube API:', error);
        throw error;
      }
    } else {
      await simulateDelay();
      return mockVideos
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, limit);
    }
  },
  
  getTopPerformingVideos: async (limit: number = 5): Promise<Video[]> => {
    if (getUseRealApi()) {
      try {
        // For demo purposes, get trending videos
        // In a real app, you might calculate your own VPH or use another metric
        return await youtubeService.getTopVideos(limit);
      } catch (error) {
        console.error('Error fetching top videos from YouTube API:', error);
        throw error;
      }
    } else {
      await simulateDelay();
      return mockVideos
        .sort((a, b) => b.vph - a.vph)
        .slice(0, limit);
    }
  }
};

// Alerts API
const alertsApi = {
  getAllAlerts: async (): Promise<Alert[]> => {
    await simulateDelay();
    return mockAlerts;
  },
  
  getUnreadAlerts: async (): Promise<Alert[]> => {
    await simulateDelay();
    return mockAlerts.filter(alert => !alert.read);
  },
  
  markAlertAsRead: async (alertId: string): Promise<Alert> => {
    await simulateDelay();
    const alert = mockAlerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');
    return { ...alert, read: true };
  },
  
  createAlert: async (data: Omit<Alert, 'id' | 'createdAt' | 'read'>): Promise<Alert> => {
    await simulateDelay();
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
    await simulateDelay();
    return mockCompetitors;
  },
  
  getCompetitorById: async (id: string): Promise<Competitor | null> => {
    await simulateDelay();
    return mockCompetitors.find(competitor => competitor.id === id) || null;
  },
  
  addCompetitor: async (data: Omit<Competitor, 'id'>): Promise<Competitor> => {
    if (getUseRealApi() && data.youtubeId) {
      try {
        // Get actual channel data from YouTube
        const channelData = await youtubeService.getChannelById(data.youtubeId);
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
        // Fallback to mock data approach if API fails
        await simulateDelay();
        return {
          id: `${mockCompetitors.length + 1}`,
          ...data
        };
      }
    } else {
      await simulateDelay();
      return {
        id: `${mockCompetitors.length + 1}`,
        ...data
      };
    }
  },
  
  removeCompetitor: async (id: string): Promise<void> => {
    await simulateDelay();
    // In a real app, we would remove the competitor
    return;
  }
};

// Transcripts API
const transcriptsApi = {
  getTranscriptForVideo: async (videoId: string): Promise<Transcript | null> => {
    await simulateDelay();
    return mockTranscripts.find(transcript => transcript.videoId === videoId) || null;
  }
};

// Metadata API
const metadataApi = {
  getMetadataForVideo: async (videoId: string): Promise<VideoMetadata | null> => {
    if (getUseRealApi()) {
      try {
        return await youtubeService.getVideoMetadata(videoId);
      } catch (error) {
        console.error('Error fetching video metadata from YouTube API:', error);
        return null;
      }
    } else {
      await simulateDelay();
      return mockMetadata.find(metadata => metadata.videoId === videoId) || null;
    }
  }
};

// Insights API
const insightsApi = {
  getInsightsForVideo: async (videoId: string): Promise<Insight | null> => {
    // Currently insights are only available in mock data
    // In a real app, this would be generated from analysis of video performance data
    await simulateDelay();
    return mockInsights.find(insight => insight.videoId === videoId) || null;
  },
  
  getInsightsForChannel: async (channelId: string): Promise<Insight[]> => {
    // Get insights related to a specific channel
    await simulateDelay();
    return mockInsights.filter(insight => insight.channelId === channelId);
  },
  
  generateInsight: async (videoId: string, type: string): Promise<Insight> => {
    // In a real app, this would analyze data and generate an insight
    await simulateDelay();
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

// Export all APIs in a single statement
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