import { NextRequest, NextResponse } from 'next/server';
import { fetchFromYouTubeApi } from '../utils';

// Helper function to extract username from various URL formats
function extractUsername(url: string): string {
  // Remove any protocol and www
  let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Remove any trailing slashes
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  
  // Handle youtube.com/c/username format
  if (cleanUrl.includes('youtube.com/c/')) {
    return cleanUrl.split('youtube.com/c/')[1];
  }
  
  // Handle youtube.com/channel/CHANNEL_ID format
  if (cleanUrl.includes('youtube.com/channel/')) {
    return cleanUrl.split('youtube.com/channel/')[1];
  }
  
  // Handle youtube.com/user/username format
  if (cleanUrl.includes('youtube.com/user/')) {
    return cleanUrl.split('youtube.com/user/')[1];
  }
  
  // Handle youtube.com/@username format
  if (cleanUrl.includes('youtube.com/@')) {
    return cleanUrl.split('youtube.com/@')[1];
  }
  
  // If it's just a username or custom URL
  return cleanUrl;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get('url');
    
    if (!customUrl) {
      return NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      );
    }
    
    const cleanUrl = extractUsername(customUrl);
    console.log('Getting channel ID for custom URL:', cleanUrl);
    
    try {
      // Try multiple search approaches
      const searchQueries = [
        cleanUrl,                    // Direct name
        `@${cleanUrl}`,             // With @ symbol
        `${cleanUrl} channel`,       // With "channel" suffix
        `${cleanUrl} youtube`        // With "youtube" suffix
      ];
      
      // Try each search query until we find a match
      for (const query of searchQueries) {
        try {
          const searchResponse = await fetchFromYouTubeApi('search', {
            q: query,
            type: 'channel',
            part: 'snippet',
            maxResults: '5'
          });
          
          const data = await searchResponse.json();
          console.log(`Search API Response for query "${query}":`, data);
          
          if (data.items && data.items.length > 0) {
            const channelId = data.items[0].id.channelId;
            console.log('Found channel ID:', channelId);
            return NextResponse.json({ channelId });
          }
        } catch (error) {
          console.error(`Error with search query "${query}":`, error);
          // Continue to next query if this one fails
          continue;
        }
      }
      
      // If we get here, no queries were successful
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error getting channel ID:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error resolving channel:', error);
    // Log more details about the error
    if (error.response) {
      console.error('RapidAPI Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to resolve channel' },
      { status: 500 }
    );
  }
} 