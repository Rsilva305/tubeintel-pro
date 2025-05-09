import { Video } from '@/types';

/**
 * Calculate the median of an array of numbers
 */
function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length === 0) return 0;
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate outlier score for a video compared to channel median
 * @param video The video to calculate outlier score for
 * @param channelVideos All videos from the same channel
 * @returns Object with outlier score and related metrics
 */
export function calculateOutlierScore(video: Video, channelVideos: Video[]) {
  // Filter out the current video from calculation
  const otherVideos = channelVideos.filter(v => v.id !== video.id);
  
  // Get view counts for calculation
  const viewCounts = otherVideos.map(v => v.viewCount);
  
  // Calculate median views (handle edge case with no other videos)
  const medianViews = viewCounts.length > 0 ? getMedian(viewCounts) : video.viewCount;
  
  // Calculate how much this video deviates from the median
  const deviationPercentage = medianViews > 0 
    ? ((video.viewCount - medianViews) / medianViews) * 100 
    : 0;
    
  // Convert to a 0-100 score with 50 being average
  // Clip score between 0 and 100
  const score = Math.min(100, Math.max(0, 50 + deviationPercentage / 4));

  // Calculate the xFactor (times factor)
  const xFactor = medianViews > 0 ? video.viewCount / medianViews : 1;
  
  // Calculate performance level categories
  let performanceLevel: 'low' | 'average' | 'high' | 'exceptional' = 'average';
  
  if (score < 30) performanceLevel = 'low';
  else if (score > 70 && score < 90) performanceLevel = 'high';
  else if (score >= 90) performanceLevel = 'exceptional';
  
  return {
    score: Math.round(score), // Round to a whole number
    medianViews,
    deviationPercentage,
    performanceLevel,
    xFactor // Add xFactor to the return value
  };
} 