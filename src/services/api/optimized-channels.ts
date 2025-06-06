import { Channel } from '@/types';
import { secureYoutubeService } from './youtube-secure';

// In-memory cache for channel ID and data
let cachedChannelId: string | null = null;
let cachedChannelData: Channel | null = null;
let channelCacheExpiry: number = 0;

// Cache duration for channel data (24 hours)
const CHANNEL_CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Get the cached channel ID or fetch it once
 */
export async function getCachedChannelId(): Promise<string> {
  if (cachedChannelId) {
    return cachedChannelId;
  }

  // Import these dynamically to avoid circular dependency
  const { getCurrentUser } = await import('@/lib/supabase');
  const { supabase } = await import('@/lib/supabase');

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Try localStorage first
  let channelId = null;
  if (typeof window !== 'undefined') {
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      channelId = localStorage.getItem(`user_${currentUserId}_youtubeChannelId`);
      if (!channelId) {
        channelId = localStorage.getItem('youtubeChannelId');
      }
    }
  }

  // If not in localStorage, get from Supabase
  if (!channelId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('youtube_channel_id')
      .eq('id', user.id)
      .single();

    if (profile?.youtube_channel_id) {
      channelId = profile.youtube_channel_id as string;
      
      // Cache in localStorage for future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('youtubeChannelId', channelId);
      }
    }
  }

  if (!channelId) {
    throw new Error('No channel ID found. Please connect your YouTube channel first.');
  }

  // Cache the channel ID
  cachedChannelId = channelId;
  return channelId;
}

/**
 * Get channel data with intelligent caching
 */
export async function getChannelWithCache(): Promise<Channel> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedChannelData && now < channelCacheExpiry) {
    return cachedChannelData;
  }

  // Get channel ID (cached)
  const channelId = await getCachedChannelId();
  
  // Fetch fresh channel data
  const channelData = await secureYoutubeService.getChannelById(channelId);
  
  // Cache the data
  cachedChannelData = channelData;
  channelCacheExpiry = now + CHANNEL_CACHE_DURATION;
  
  return channelData;
}

/**
 * Clear the channel cache (useful when user changes channel)
 */
export function clearChannelCache(): void {
  cachedChannelId = null;
  cachedChannelData = null;
  channelCacheExpiry = 0;
}

/**
 * Get channel ID without full channel data (for video API calls)
 */
export async function getChannelIdForVideos(): Promise<string> {
  return getCachedChannelId();
} 