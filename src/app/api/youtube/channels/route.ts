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

// GET /api/youtube/channels
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseUrl = getBaseUrl(request);
    
    // Extract parameters
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    const forUsername = searchParams.get('forUsername');
    const part = searchParams.get('part') || 'snippet,statistics';
    
    if (id) {
      // Get channel by ID
      return fetchFromYouTubeApi('channels', {
        part,
        id
      });
    } else if (forUsername) {
      // Get channel by username (legacy)
      return fetchFromYouTubeApi('channels', {
        part,
        forUsername
      });
    } else if (username) {
      // First try with forUsername parameter
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
      
      // Try with forUsername first
      const channelUrl = `${baseUrl}/api/youtube/channels?forUsername=${cleanUsername}&part=${part}`;
      const response = await fetch(channelUrl);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return NextResponse.json(data);
      }
      
      // If no results, try searching
      const searchParams = new URLSearchParams({
        q: `@${cleanUsername}`,
        type: 'channel',
        part: 'snippet',
        maxResults: '5'
      });
      
      const searchUrl = `${baseUrl}/api/youtube/search?${searchParams}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        // Get channel IDs from search results
        const channelIds = searchData.items
          .map((item: any) => item.id.channelId)
          .join(',');
        
        // Get full channel details
        return fetch(`${baseUrl}/api/youtube/channels?id=${channelIds}&part=${part}`);
      }
      
      // No results found
      return NextResponse.json({ items: [] });
    } else {
      // Bad request - no identifier provided
      return NextResponse.json(
        { error: 'Missing channel identifier. Please provide id, username, or forUsername parameter.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in channels route:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
} 