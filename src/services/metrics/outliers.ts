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

/**
 * Calculate a comprehensive performance score for a video based on multiple metrics
 * @param video The video to calculate performance score for
 * @param channelVideos All videos from the same channel
 * @returns Number representing overall performance (higher is better)
 */
export function calculatePerformanceScore(video: Video, channelVideos: Video[]) {
  // Get the outlier score (0-100)
  const outlierData = calculateOutlierScore(video, channelVideos);
  
  // Calculate engagement rate (likes + comments / views) * 100
  const engagementRate = video.viewCount > 0 ? 
    ((video.likeCount + video.commentCount) / video.viewCount) * 100 : 0;
  
  // Calculate recency factor (newer videos get a boost)
  const ageInDays = (new Date().getTime() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - (ageInDays / 30)); // Factor decreases over 30 days
  
  // Calculate final performance score (weighted combination)
  return (
    (outlierData.score * 0.5) +  // Outlier score: 50% weight
    (engagementRate * 0.3) +     // Engagement: 30% weight
    (video.vph * 0.1) +          // VPH: 10% weight
    (recencyFactor * 10)         // Recency: 10% weight (0-10 points)
  );
}

/**
 * Get top performing videos based on comprehensive performance score
 * @param videos Array of videos to rank
 * @param limit Maximum number of videos to return
 * @returns Array of top performing videos
 */
export function getTopPerformingVideos(videos: Video[], limit: number = 5): Video[] {
  if (!videos || videos.length === 0) return [];
  
  // Calculate performance scores for all videos
  const videosWithScores = videos.map(video => {
    const performanceScore = calculatePerformanceScore(video, videos);
    return { ...video, performanceScore };
  });
  
  // Sort by performance score and return top videos
  return videosWithScores
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, limit);
} 