import { NextRequest, NextResponse } from 'next/server';
import { fetchFromYouTubeApi } from '../../utils';

// GET /api/youtube/videos/recent
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract parameters
    const channelId = searchParams.get('channelId');
    const publishedAfter = searchParams.get('publishedAfter');
    const maxResults = searchParams.get('maxResults') || '20';
    
    if (!channelId || !publishedAfter) {
      return NextResponse.json(
        { error: 'Missing required parameters: channelId and publishedAfter' },
        { status: 400 }
      );
    }
    
    // First, get video IDs using search endpoint with publishedAfter filter
    const searchResponse = await fetchFromYouTubeApi('search', {
      part: 'snippet',
      channelId,
      maxResults,
      order: 'date',
      publishedAfter,
      type: 'video'
    });

    if (!searchResponse.ok) {
      return searchResponse;
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Get video IDs from search results
    const videoIds = searchData.items
      .map((item: any) => item.id.videoId)
      .join(',');
    
    // Get full video details
    return await fetchFromYouTubeApi('videos', {
      part: 'snippet,statistics',
      id: videoIds
    });
  } catch (error) {
    console.error('Error fetching recent videos:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching recent videos' },
      { status: 500 }
    );
  }
} 