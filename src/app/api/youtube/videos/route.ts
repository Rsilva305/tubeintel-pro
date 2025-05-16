import { NextRequest, NextResponse } from 'next/server';
import { fetchFromYouTubeApi } from '../utils';
import { headers } from 'next/headers';

// Server-side search cache to retain results even if quota is exceeded
const searchCache = new Map<string, { data: any, timestamp: number }>();
const SEARCH_CACHE_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Helper to get the base URL
function getBaseUrl(req: NextRequest): string {
  // For development environment
  if (process.env.NODE_ENV === 'development') {
    return `http://${req.headers.get('host')}`;
  }
  // For production, use the host from the headers
  const host = headers().get('host') || req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// GET /api/youtube/videos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseUrl = getBaseUrl(request);
    
    // Extract parameters
    const id = searchParams.get('id');
    const channelId = searchParams.get('channelId');
    const maxResults = searchParams.get('maxResults') || '10';
    const part = searchParams.get('part') || 'snippet,statistics';
    
    // Different API endpoints based on parameters
    if (id) {
      // Get specific video(s)
      return fetchFromYouTubeApi('videos', {
        part,
        id,
      });
    } else if (channelId) {
      // Create cache key for this search
      const searchCacheKey = `search:${channelId}:${maxResults}`;
      
      // Check our local search cache first
      const cachedSearch = searchCache.get(searchCacheKey);
      let searchData;
      
      // First, try to get video IDs from the search API or cache
      try {
        // Only fetch from API if we don't have cached data or it's expired
        if (!cachedSearch || Date.now() - cachedSearch.timestamp > SEARCH_CACHE_DURATION) {
          console.log('Fetching fresh search results for channel:', channelId);
          
          // First, get video IDs using search endpoint
          const searchResponse = await fetchFromYouTubeApi('search', {
            part: 'snippet',
            channelId,
            maxResults,
            order: 'date',
            type: 'video'
          });

          if (!searchResponse.ok) {
            throw new Error('Failed to fetch video IDs');
          }

          searchData = await searchResponse.json();
          
          // Cache these search results for future use
          searchCache.set(searchCacheKey, {
            data: searchData,
            timestamp: Date.now()
          });
        } else {
          console.log('Using cached search results for channel:', channelId);
          searchData = cachedSearch.data;
        }
      } catch (error) {
        // If search fails but we have cached data, use it
        if (cachedSearch) {
          console.log('Search API quota exceeded, using cached search results from:', 
            new Date(cachedSearch.timestamp).toLocaleString());
          searchData = cachedSearch.data;
        } else {
          // If no cached data, we can't proceed
          console.error('YouTube search API quota exceeded and no cached data available');
          return NextResponse.json(
            { error: 'YouTube API quota exceeded and no cached data available' },
            { status: 503 }
          );
        }
      }
      
      // Extract video IDs
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      if (!videoIds) {
        return NextResponse.json({ items: [] });
      }

      // Then, get video details with statistics
      return fetchFromYouTubeApi('videos', {
        part: 'snippet,statistics',
        id: videoIds
      });
    } else {
      // Get popular videos
      return fetchFromYouTubeApi('videos', {
        part,
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults
      });
    }
  } catch (error) {
    console.error('Error in videos route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
} 