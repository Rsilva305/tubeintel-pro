import { Video, Channel } from '@/types';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

// Interface for trend calculation
export interface TrendData {
  current: number;
  previous: number;
  percentage: number;
  hasPreviousData: boolean;
}

// Store daily video metrics
export async function storeVideoMetrics(videos: Video[]): Promise<boolean> {
  try {
    console.log('storeVideoMetrics: Starting...');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      console.error('Cannot store metrics: User not authenticated');
      return false;
    }
    console.log('storeVideoMetrics: User authenticated', user.id);
    
    if (videos.length === 0) {
      console.warn('storeVideoMetrics: No videos provided to store');
      return true; // Return true since there's nothing to store
    }
    
    // Prepare batch insert data
    const metricsData = videos.map(video => ({
      user_id: user.id,
      video_id: video.id,
      channel_id: video.channelId,
      view_count: video.viewCount,
      like_count: video.likeCount,
      comment_count: video.commentCount,
      vph: video.vph,
      recorded_at: new Date(),
      recorded_date: new Date().toISOString().split('T')[0] // Add the date for the unique constraint
    }));
    
    console.log(`storeVideoMetrics: Prepared data for ${metricsData.length} videos`);
    
    // Insert all video metrics
    console.log('storeVideoMetrics: Sending upsert to Supabase...');
    const { error } = await supabase
      .from('video_metrics_history')
      .upsert(metricsData);
    
    if (error) {
      console.error('Error storing video metrics:', error);
      return false;
    }
    
    console.log(`storeVideoMetrics: Successfully stored metrics for ${metricsData.length} videos`);
    return true;
  } catch (error) {
    console.error('Error in storeVideoMetrics:', error);
    return false;
  }
}

// Store daily channel metrics
export async function storeChannelMetrics(channel: Channel): Promise<boolean> {
  try {
    console.log('storeChannelMetrics: Starting...');
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      console.error('Cannot store metrics: User not authenticated');
      return false;
    }
    console.log('storeChannelMetrics: User authenticated', user.id);
    
    // Prepare channel metrics data
    const metricsData = {
      user_id: user.id,
      channel_id: channel.youtubeId,
      total_views: channel.viewCount,
      total_likes: 0, // This would need to be calculated from videos
      subscriber_count: channel.subscriberCount,
      video_count: channel.videoCount,
      recorded_at: new Date(),
      recorded_date: new Date().toISOString().split('T')[0] // Add the date for the unique constraint
    };
    
    console.log('storeChannelMetrics: Prepared data for channel', channel.name || channel.youtubeId);
    
    // Insert channel metrics
    console.log('storeChannelMetrics: Sending upsert to Supabase...');
    const { error } = await supabase
      .from('channel_metrics_history')
      .upsert(metricsData);
    
    if (error) {
      console.error('Error storing channel metrics:', error);
      return false;
    }
    
    console.log(`storeChannelMetrics: Successfully stored metrics for channel ${channel.name}`);
    return true;
  } catch (error) {
    console.error('Error in storeChannelMetrics:', error);
    return false;
  }
}

// Get video metrics for trend calculation
export async function getVideoTrendData(
  videoId: string, 
  currentMetric: 'view_count' | 'like_count' | 'comment_count' | 'vph',
  currentValue: number,
  daysBack: number = 30
): Promise<TrendData> {
  try {
    console.log(`getVideoTrendData: Fetching ${currentMetric} trend for video ${videoId}`);
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Calculate the date for previous period
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - daysBack);
    
    // Query for the metrics from the previous period
    const { data, error } = await supabase
      .from('video_metrics_history')
      .select(currentMetric)
      .eq('video_id', videoId)
      .eq('user_id', user.id)
      .lt('recorded_at', previousDate.toISOString())
      .gte('recorded_at', new Date(previousDate.getTime() - (24 * 60 * 60 * 1000)).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching video metrics history:', error);
      return calculateTrend(currentValue, 0);
    }
    
    // Check if we have previous data
    if (data && data.length > 0) {
      const record = data[0] as Record<string, number>;
      const previousValue = record[currentMetric] || 0;
      console.log(`getVideoTrendData: Found previous value: ${previousValue}`);
      return calculateTrend(currentValue, previousValue);
    }
    
    // No previous data
    console.log('getVideoTrendData: No previous data found');
    return calculateTrend(currentValue, 0);
  } catch (error) {
    console.error('Error in getVideoTrendData:', error);
    return calculateTrend(currentValue, 0);
  }
}

// Get channel metrics for trend calculation
export async function getChannelTrendData(
  channelId: string,
  currentMetric: 'total_views' | 'subscriber_count' | 'video_count',
  currentValue: number,
  daysBack: number = 30
): Promise<TrendData> {
  try {
    console.log(`getChannelTrendData: Fetching ${currentMetric} trend for channel ${channelId}`);
    
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Calculate the date for previous period
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - daysBack);
    
    // Query for the metrics from the previous period
    const { data, error } = await supabase
      .from('channel_metrics_history')
      .select(currentMetric)
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .lt('recorded_at', previousDate.toISOString())
      .gte('recorded_at', new Date(previousDate.getTime() - (24 * 60 * 60 * 1000)).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching channel metrics history:', error);
      return calculateTrend(currentValue, 0);
    }
    
    // Check if we have previous data
    if (data && data.length > 0) {
      const record = data[0] as Record<string, number>;
      const previousValue = record[currentMetric] || 0;
      console.log(`getChannelTrendData: Found previous value: ${previousValue}`);
      return calculateTrend(currentValue, previousValue);
    }
    
    // No previous data
    console.log('getChannelTrendData: No previous data found');
    return calculateTrend(currentValue, 0);
  } catch (error) {
    console.error('Error in getChannelTrendData:', error);
    return calculateTrend(currentValue, 0);
  }
}

// Helper to calculate trend data
export function calculateTrend(current: number, previous: number): TrendData {
  // If both are 0, trend is 0
  if (current === 0 && previous === 0) {
    return { current, previous, percentage: 0, hasPreviousData: false };
  }
  
  // Check if we have previous data
  const hasPreviousData = previous !== 0;
  
  // If only previous is 0 but current has value, show as 100% increase
  if (previous === 0 && current > 0) {
    return { current, previous, percentage: 100, hasPreviousData: false };
  }
  
  // Normal calculation
  const percentage = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
    hasPreviousData: true
  };
}