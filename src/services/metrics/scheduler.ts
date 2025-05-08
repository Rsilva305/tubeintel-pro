import { storeVideoMetrics, storeChannelMetrics } from './history';
import { videosApi, channelsApi } from '@/services/api';
import { Channel } from '@/types';

// Keeps track of whether metrics have been collected today
let lastCollectionDate: string | null = null;

/**
 * Collects and stores metrics for all videos and the channel
 * This is designed to run once per day to build historical data
 */
export async function collectDailyMetrics(): Promise<boolean> {
  try {
    console.log('Starting collectDailyMetrics function');
    
    // Check if we already collected metrics today
    const today = new Date().toISOString().split('T')[0];
    if (lastCollectionDate === today) {
      console.log('Metrics already collected today');
      return true;
    }
    
    console.log('Starting daily metrics collection...');
    
    // 1. Get channel data
    console.log('Fetching channel data...');
    const channel = await channelsApi.getMyChannel();
    console.log('Channel data received:', channel.name || 'Unknown channel');
    
    // 2. Get all recent videos
    console.log('Fetching recent videos...');
    const videos = await videosApi.getAllVideos();
    console.log(`Fetched ${videos.length} videos`);
    
    if (videos.length === 0) {
      console.warn('No videos found to store metrics for');
    }
    
    // 3. Store metrics data
    console.log('Storing metrics data to Supabase...');
    const [videosStored, channelStored] = await Promise.all([
      storeVideoMetrics(videos),
      storeChannelMetrics(channel)
    ]);
    
    console.log('Store results - Videos:', videosStored, 'Channel:', channelStored);
    
    // 4. Update last collection date
    if (videosStored && channelStored) {
      lastCollectionDate = today;
      console.log('Daily metrics collection completed successfully');
      return true;
    } else {
      console.error('Failed to store all metrics');
      return false;
    }
  } catch (error) {
    console.error('Error in daily metrics collection:', error);
    return false;
  }
}

/**
 * Initialize the metrics scheduler to run daily and immediately on startup
 */
export function initializeMetricsScheduler() {
  // Collect metrics immediately on startup
  collectDailyMetrics();
  
  // Set up a daily collection at midnight
  const scheduleNextCollection = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // Set to 12:05 AM (just after midnight)
    
    const timeUntilNextCollection = tomorrow.getTime() - now.getTime();
    
    // Schedule next collection
    setTimeout(() => {
      collectDailyMetrics();
      scheduleNextCollection(); // Schedule the next day
    }, timeUntilNextCollection);
    
    console.log(`Next metrics collection scheduled in ${Math.round(timeUntilNextCollection / (1000 * 60 * 60))} hours`);
  };
  
  // Start the scheduling process
  scheduleNextCollection();
}

/**
 * Forces an immediate collection of metrics
 */
export async function forceCollectMetrics(): Promise<boolean> {
  // Reset the last collection date to force a new collection
  lastCollectionDate = null;
  return collectDailyMetrics();
} 