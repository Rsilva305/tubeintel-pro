import { NextRequest, NextResponse } from 'next/server';
import { fetchFromYouTubeApi } from '../utils';

// Server-side search cache to retain results even if quota is exceeded
const searchCache = new Map<string, { data: any, timestamp: number }>();
const SEARCH_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Track configuration changes
let lastKnownConfig = {
  defaultMaxResults: '20'
};

// Cache management functions
const clearSearchCache = () => {
  console.log('Clearing search cache...');
  searchCache.clear();
  console.log('Search cache cleared');
};

const checkConfigChanges = (currentMaxResults: string) => {
  if (currentMaxResults !== lastKnownConfig.defaultMaxResults) {
    console.log(`Configuration change detected: maxResults changed from ${lastKnownConfig.defaultMaxResults} to ${currentMaxResults}`);
    clearSearchCache();
    lastKnownConfig.defaultMaxResults = currentMaxResults;
  }
};

const getCacheKey = (channelId: string, maxResults: string, pageToken: string = '', config = '') => {
  return `search:${channelId}:${maxResults}:${pageToken}:${config}`;
};

// GET /api/youtube/videos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract parameters
    const id = searchParams.get('id');
    const channelId = searchParams.get('channelId');
    const maxResults = searchParams.get('maxResults') || '20'; // Default to 20
    const pageToken = searchParams.get('pageToken') || ''; // Support pagination
    const part = searchParams.get('part') || 'snippet,statistics';
    
    // Check for configuration changes
    checkConfigChanges(maxResults);
    
    // Different API endpoints based on parameters
    if (id) {
      // Get specific video(s)
      return fetchFromYouTubeApi('videos', {
        part,
        id,
      });
    } else if (channelId) {
      console.log(`\n=== Video Search Debug ===`);
      console.log(`Channel ID: ${channelId}`);
      console.log(`Requested videos: ${maxResults}`);
      console.log(`Page token: ${pageToken || 'none (first page)'}`);
      
      // Create cache key that includes maxResults and pageToken
      const searchCacheKey = getCacheKey(channelId, maxResults, pageToken);
      
      // Try to fetch fresh data first
      try {
        console.log('Attempting to fetch fresh search results for channel:', channelId);
        
        // Build search parameters
        const searchParams: Record<string, string> = {
          part: 'snippet',
          channelId,
          maxResults,
          order: 'date',
          type: 'video'
        };
        
        // Add pageToken if provided (for pagination)
        if (pageToken) {
          searchParams.pageToken = pageToken;
        }
        
        // First, get video IDs using search endpoint
        const searchResponse = await fetchFromYouTubeApi('search', searchParams);

        if (!searchResponse.ok) {
          throw new Error('Failed to fetch video IDs');
        }

        const searchData = await searchResponse.json();
        
        // Debug: Log the structure of the response
        console.log('Search API response:', {
          hasItems: !!searchData?.items,
          itemsLength: searchData?.items?.length || 0,
          requestedCount: maxResults,
          hasNextPageToken: !!searchData?.nextPageToken,
          pageToken: searchData?.nextPageToken || 'none',
          firstItemId: searchData?.items?.[0]?.id?.videoId || 'none'
        });
        
        // Validate response structure
        if (!searchData || !searchData.items || !Array.isArray(searchData.items)) {
          console.error('Invalid search response structure:', searchData);
          throw new Error('Invalid search response structure from YouTube API');
        }
        
        // Cache these search results for future use
        searchCache.set(searchCacheKey, {
          data: searchData,
          timestamp: Date.now()
        });
        
        // Extract video IDs and fetch details
        const videoIds = searchData.items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean)
          .join(',');
        
        if (!videoIds) {
          console.log('No video IDs found in search response');
          // Still return the nextPageToken if available for pagination
          return NextResponse.json({ 
            items: [], 
            nextPageToken: searchData.nextPageToken 
          });
        }

        // Get video details with statistics
        const videosResponse = await fetchFromYouTubeApi('videos', {
          part: 'snippet,statistics,contentDetails',
          id: videoIds
        });
        
        if (!videosResponse.ok) {
          throw new Error('Failed to fetch video details');
        }
        
        const videosData = await videosResponse.json();
        
        // Include pagination token in response
        const response = {
          ...videosData,
          nextPageToken: searchData.nextPageToken // Pass through pagination token
        };
        
        return NextResponse.json(response);
        
      } catch (error) {
        console.error('Error fetching fresh data:', error);
        
        // If fresh fetch fails, check cache
        const cachedSearch = searchCache.get(searchCacheKey);
        if (cachedSearch && Date.now() - cachedSearch.timestamp <= SEARCH_CACHE_DURATION) {
          console.log('Using cached search results from:', new Date(cachedSearch.timestamp).toLocaleString());
          
          const videoIds = cachedSearch.data.items
            .map((item: any) => item.id?.videoId)
            .filter(Boolean)
            .join(',');
          
          if (!videoIds) {
            return NextResponse.json({ 
              items: [], 
              nextPageToken: cachedSearch.data.nextPageToken 
            });
          }

          const videosResponse = await fetchFromYouTubeApi('videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoIds
          });
          
          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            const response = {
              ...videosData,
              nextPageToken: cachedSearch.data.nextPageToken
            };
            return NextResponse.json(response);
          }
        }
        
        // If no valid cache, return error
        console.error('No valid cached data available');
        return NextResponse.json(
          { error: 'Failed to fetch videos and no valid cache available' },
          { status: 503 }
        );
      }
    } else {
      // Get popular videos
      return fetchFromYouTubeApi('videos', {
        part: 'snippet,statistics,contentDetails',
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

export const dynamic = 'force-dynamic'; 