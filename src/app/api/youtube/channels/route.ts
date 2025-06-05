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
    } else if (forUsername || username) {
      // Get channel by username
      const rawUsername = forUsername || username || '';
      const cleanUsername = rawUsername.startsWith('@') 
        ? rawUsername.substring(1) 
        : rawUsername;
      
      // Try multiple search approaches
      const searchQueries = [
        cleanUsername,                    // Direct name
        `@${cleanUsername}`,             // With @ symbol
        `${cleanUsername} channel`,       // With "channel" suffix
        `${cleanUsername} youtube`        // With "youtube" suffix
      ];
      
      let channelId = null;
      
      // Try each search query until we find a match
      for (const query of searchQueries) {
        try {
          const searchParams: Record<string, string> = {
            q: query,
            type: 'channel',
            part: 'snippet',
            maxResults: '5'
          };
          
          const searchResponse = await fetchFromYouTubeApi('search', searchParams);
          const searchData = await searchResponse.json();
          
          if (searchData.items && searchData.items.length > 0) {
            // Get channel IDs from search results
            const channelIds = searchData.items
              .map((item: any) => item.id.channelId)
              .join(',');
            
            // Get full channel details
            const channelResponse = await fetchFromYouTubeApi('channels', {
              part,
              id: channelIds
            });
            
            const channelData = await channelResponse.json();
            
            if (channelData.items && channelData.items.length > 0) {
              // Return the first matching channel
              return NextResponse.json(channelData);
            }
          }
        } catch (error) {
          console.error(`Error with search query "${query}":`, error);
          // Continue to next query if this one fails
          continue;
        }
      }
      
      // No results found after trying all queries
      return NextResponse.json({ items: [] });
    } else {
      // Bad request - no identifier provided
      return NextResponse.json(
        { error: 'Missing channel identifier. Please provide id or username parameter.' },
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

export const dynamic = 'force-dynamic'; 