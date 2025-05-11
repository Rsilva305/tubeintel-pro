import { NextRequest, NextResponse } from 'next/server';
import { fetchFromYouTubeApi } from '../utils';
import { headers } from 'next/headers';

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

      const searchData = await searchResponse.json();
      
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