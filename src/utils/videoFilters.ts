import { Video } from '@/types';

/**
 * Determines if a video is a YouTube Short based on duration and other criteria
 * YouTube Shorts are videos that are 3 minutes (180 seconds) or less
 */
export const isVideoShort = (video: Video): boolean => {
  // Primary check: duration <= 3 minutes (180 seconds)
  if (video.duration !== undefined && video.duration <= 180) {
    return true;
  }
  
  // Fallback check: look for shorts hashtags/keywords in title/description
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();
  
  const shortsKeywords = ['#shorts', '#short', 'youtube shorts', 'yt shorts'];
  return shortsKeywords.some(keyword => 
    title.includes(keyword) || description.includes(keyword)
  );
};

/**
 * Filters out shorts from a video array
 */
export const filterOutShorts = (videos: Video[]): Video[] => {
  return videos.filter(video => !isVideoShort(video));
};

/**
 * Filters videos to only include shorts
 */
export const filterOnlyShorts = (videos: Video[]): Video[] => {
  return videos.filter(video => isVideoShort(video));
};

/**
 * Applies shorts filtering based on user preference
 * @param videos - Array of videos to filter
 * @param includeShorts - Whether to include shorts in the results
 * @param shortsOnly - Whether to show only shorts (overrides includeShorts)
 */
export const applyShortsFiltering = (
  videos: Video[], 
  includeShorts: boolean = false, 
  shortsOnly: boolean = false
): Video[] => {
  if (shortsOnly) {
    return filterOnlyShorts(videos);
  }
  
  if (!includeShorts) {
    return filterOutShorts(videos);
  }
  
  return videos; // Return all videos if including shorts
};

/**
 * Formats duration in seconds to human readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}; 