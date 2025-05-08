import { NextRequest } from 'next/server';
import { fetchFromYouTubeApi } from '../utils';

// GET /api/youtube/search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract parameters
    const query = searchParams.get('q');
    const channelId = searchParams.get('channelId');
    const type = searchParams.get('type') || 'video';
    const maxResults = searchParams.get('maxResults') || '10';
    const part = searchParams.get('part') || 'snippet';
    const order = searchParams.get('order') || 'relevance';
    
    const params: Record<string, string> = {
      part,
      maxResults,
      type,
      order
    };
    
    // Add either query or channelId depending on what was provided
    if (query) {
      params.q = query;
    }
    
    if (channelId) {
      params.channelId = channelId;
    }
    
    return fetchFromYouTubeApi('search', params);
  } catch (error) {
    console.error('Error in search route:', error);
    return Response.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
} 