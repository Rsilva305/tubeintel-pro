import { createAdminClient } from '@/utils/supabase/server';
import { Video } from '@/types';

// Use admin client for server-side operations that need to bypass RLS
const supabase = createAdminClient();

export interface StoredVideo {
  id: string;
  youtube_id: string;
  channel_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  vph: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelSyncStatus {
  channel_id: string;
  last_sync_at: string | null;
  total_videos_synced: number;
  latest_video_date: string | null;
  full_sync_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const videosStorageApi = {
  // Convert our Video type to StoredVideo format
  formatVideoForStorage: (video: Video): Omit<StoredVideo, 'id' | 'created_at' | 'updated_at'> => ({
    youtube_id: video.youtubeId,
    channel_id: video.channelId,
    title: video.title,
    description: video.description,
    thumbnail_url: video.thumbnailUrl,
    published_at: video.publishedAt.toISOString(),
    view_count: video.viewCount,
    like_count: video.likeCount,
    comment_count: video.commentCount,
    vph: video.vph
  }),

  // Convert StoredVideo back to our Video type
  formatStoredVideoToVideo: (storedVideo: StoredVideo): Video => ({
    id: storedVideo.id,
    youtubeId: storedVideo.youtube_id,
    channelId: storedVideo.channel_id,
    title: storedVideo.title,
    description: storedVideo.description,
    thumbnailUrl: storedVideo.thumbnail_url,
    publishedAt: new Date(storedVideo.published_at),
    viewCount: storedVideo.view_count,
    likeCount: storedVideo.like_count,
    commentCount: storedVideo.comment_count,
    vph: storedVideo.vph
  }),

  // Get videos for specific channels from storage
  getStoredVideosForChannels: async (channelIds: string[], limit?: number): Promise<Video[]> => {
    try {
      const limitText = limit ? `limit: ${limit} per channel` : 'no limit (all videos)';
      console.log(`📦 Fetching stored videos for ${channelIds.length} channels (${limitText})`);
      
      const query = supabase
        .from('videos')
        .select('*')
        .in('channel_id', channelIds)
        .order('published_at', { ascending: false });
      
      // Only apply limit if one is specified
      if (limit) {
        query.limit(limit * channelIds.length); // Get up to limit per channel
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Error fetching stored videos:', error);
        throw error;
      }
      
      const videos = (data || []).map(videosStorageApi.formatStoredVideoToVideo);
      console.log(`✅ Retrieved ${videos.length} stored videos`);
      return videos;
    } catch (error) {
      console.error('💥 Error in getStoredVideosForChannels:', error);
      return [];
    }
  },

  // Get sync status for a channel
  getChannelSyncStatus: async (channelId: string): Promise<ChannelSyncStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('channel_sync_status')
        .select('*')
        .eq('channel_id', channelId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Error fetching sync status:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('💥 Error in getChannelSyncStatus:', error);
      return null;
    }
  },

  // Update sync status for a channel
  updateChannelSyncStatus: async (
    channelId: string, 
    totalVideos: number, 
    latestVideoDate: Date | null
  ): Promise<void> => {
    try {
      const updateData = {
        channel_id: channelId,
        last_sync_at: new Date().toISOString(),
        total_videos_synced: totalVideos,
        latest_video_date: latestVideoDate?.toISOString(),
        full_sync_completed: true
      };

      const { error } = await supabase
        .from('channel_sync_status')
        .upsert(updateData, { onConflict: 'channel_id' });
      
      if (error) {
        console.error('❌ Error updating sync status:', error);
        throw error;
      }
      
      console.log(`✅ Updated sync status for channel ${channelId}`);
    } catch (error) {
      console.error('💥 Error in updateChannelSyncStatus:', error);
      throw error;
    }
  },

  // Store multiple videos in batch
  storeVideos: async (videos: Video[]): Promise<void> => {
    if (videos.length === 0) return;
    
    try {
      console.log(`💾 Storing ${videos.length} videos in database...`);
      
      // Deduplicate videos by YouTube ID to prevent conflicts
      const uniqueVideos = videos.reduce((acc, video) => {
        const existing = acc.find(v => v.youtubeId === video.youtubeId);
        if (!existing) {
          acc.push(video);
        } else {
          // Keep the one with more recent data (higher view count as proxy)
          if (video.viewCount > existing.viewCount) {
            const index = acc.findIndex(v => v.youtubeId === video.youtubeId);
            acc[index] = video;
          }
        }
        return acc;
      }, [] as Video[]);
      
      console.log(`🔄 Deduplicated from ${videos.length} to ${uniqueVideos.length} unique videos`);
      
      const videosToStore = uniqueVideos.map(videosStorageApi.formatVideoForStorage);
      
      // Use a more specific upsert strategy
      const { error } = await supabase
        .from('videos')
        .upsert(videosToStore, { 
          onConflict: 'youtube_id',
          ignoreDuplicates: false // Update existing records
        });
      
      if (error) {
        console.error('❌ Error storing videos:', error);
        throw error;
      }
      
      console.log(`✅ Successfully stored ${uniqueVideos.length} unique videos`);
    } catch (error) {
      console.error('💥 Error in storeVideos:', error);
      throw error;
    }
  },

  // Get the latest video date for a channel
  getLatestVideoDate: async (channelId: string): Promise<Date | null> => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('published_at')
        .eq('channel_id', channelId)
        .order('published_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching latest video date:', error);
        throw error;
      }
      
      return data ? new Date(data.published_at) : null;
    } catch (error) {
      console.error('💥 Error in getLatestVideoDate:', error);
      return null;
    }
  },

  // Check if we need to sync a channel (hasn't been synced recently)
  needsSync: async (channelId: string, maxAgeMinutes = 30): Promise<boolean> => {
    try {
      const syncStatus = await videosStorageApi.getChannelSyncStatus(channelId);
      
      if (!syncStatus || !syncStatus.last_sync_at) {
        console.log(`🔄 Channel ${channelId} needs initial sync`);
        return true;
      }
      
      const lastSync = new Date(syncStatus.last_sync_at);
      const now = new Date();
      const ageMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);
      
      const needsSync = ageMinutes > maxAgeMinutes;
      console.log(`⏰ Channel ${channelId} last synced ${Math.round(ageMinutes)} minutes ago. Needs sync: ${needsSync}`);
      
      return needsSync;
    } catch (error) {
      console.error('💥 Error in needsSync:', error);
      return true; // Default to needing sync if we can't determine
    }
  },

  // Get all channels that need syncing
  getChannelsNeedingSync: async (maxAgeMinutes = 30): Promise<string[]> => {
    try {
      // Get all channels that have been tracked (from competitor_lists table)
      const { data: competitors, error: competitorsError } = await supabase
        .from('competitor_lists')
        .select('youtube_id');
      
      if (competitorsError) {
        console.error('❌ Error fetching competitors:', competitorsError);
        return [];
      }
      
      const allChannelIds = Array.from(new Set(competitors.map(c => c.youtube_id)));
      console.log(`🔍 Checking ${allChannelIds.length} channels for sync needs...`);
      
      const channelsNeedingSync: string[] = [];
      
      for (const channelId of allChannelIds) {
        if (await videosStorageApi.needsSync(channelId, maxAgeMinutes)) {
          channelsNeedingSync.push(channelId);
        }
      }
      
      console.log(`📋 ${channelsNeedingSync.length} channels need syncing`);
      return channelsNeedingSync;
    } catch (error) {
      console.error('💥 Error in getChannelsNeedingSync:', error);
      return [];
    }
  },

  // Get stored video count for a channel
  getStoredVideoCount: async (channelId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);
      
      if (error) {
        console.error('❌ Error getting stored video count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('💥 Error in getStoredVideoCount:', error);
      return 0;
    }
  }
}; 