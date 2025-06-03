import { NextResponse } from 'next/server';
import { secureYoutubeService as youtubeService } from '@/services/api/youtube-secure';

// Helper function to extract username from URL
function extractUsername(input: string): string {
  // Remove any trailing slashes
  input = input.replace(/\/$/, '');
  
  // If it's a full URL, extract the username
  if (input.includes('youtube.com')) {
    const match = input.match(/youtube\.com\/@([^\/]+)/);
    if (match) {
      return match[1];
    }
  }
  
  // If it's just a username with @, remove the @
  if (input.startsWith('@')) {
    return input.substring(1);
  }
  
  return input;
}

// Helper function to normalize usernames for comparison
function normalizeUsername(username: string): string {
  return username.toLowerCase().replace(/^@/, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const customUrl = searchParams.get('customUrl');
  const channelId = searchParams.get('channelId');

  console.log('Channel resolution request:', { username, customUrl, channelId });

  try {
    if (channelId) {
      console.log('Validating channel ID:', channelId);
      // If we already have a channel ID, just validate it
      const channel = await youtubeService.getChannelById(channelId);
      console.log('Channel validation successful:', channel);
      const response = { channelId: channel.youtubeId };
      console.log('Sending response:', response);
      return NextResponse.json(response);
    }

    if (username) {
      const cleanUsername = extractUsername(username);
      const normalizedUsername = normalizeUsername(cleanUsername);
      console.log('Getting channel ID for username:', cleanUsername, '(normalized:', normalizedUsername, ')');
      
      try {
        // Use a more precise search query
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&` +
          `q=${cleanUsername}&` + // Remove @ to get more precise results
          `type=channel&` +
          `maxResults=5&` + // Get more results to find the exact match
          `key=${process.env.YOUTUBE_API_KEY}`
        );
        
        const searchData = await searchResponse.json();
        console.log('Search API Response:', searchData);
        
        if (searchData.items && searchData.items.length > 0) {
          // Look through all results to find the exact match
          for (const item of searchData.items) {
            const channelId = item.id.channelId;
            console.log('Checking channel:', channelId);
            
            // Verify the channel using the channels API
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?` +
              `part=snippet&` +
              `id=${channelId}&` +
              `key=${process.env.YOUTUBE_API_KEY}`
            );
            
            const channelData = await channelResponse.json();
            console.log('Channel API Response:', channelData);
            
            if (channelData.items && channelData.items.length > 0) {
              const channel = channelData.items[0];
              const channelCustomUrl = channel.snippet.customUrl;
              const channelTitle = channel.snippet.title;
              
              console.log('Channel details:', {
                id: channelId,
                customUrl: channelCustomUrl,
                title: channelTitle
              });
              
              // Normalize the channel's custom URL and title for comparison
              const normalizedCustomUrl = normalizeUsername(channelCustomUrl || '');
              const normalizedTitle = normalizeUsername(channelTitle);
              
              // Check if this is the exact channel we're looking for
              if (normalizedCustomUrl === normalizedUsername || 
                  normalizedTitle === normalizedUsername ||
                  normalizedTitle.includes(normalizedUsername) ||
                  normalizedCustomUrl.includes(normalizedUsername)) {
                console.log('Found exact matching channel ID:', channelId);
                return NextResponse.json({ channelId });
              }
            }
          }
        }
        
        // If no exact match found, try direct channel lookup
        console.log('Trying direct channel lookup...');
        const directResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?` +
          `part=id,snippet&` +
          `forUsername=${cleanUsername}&` +
          `key=${process.env.YOUTUBE_API_KEY}`
        );
        
        const directData = await directResponse.json();
        console.log('Direct lookup Response:', directData);
        
        if (directData.items && directData.items.length > 0) {
          const channelId = directData.items[0].id;
          console.log('Found channel ID from direct lookup:', channelId);
          return NextResponse.json({ channelId });
        }
        
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
    }

    if (customUrl) {
      const cleanUrl = extractUsername(customUrl);
      console.log('Getting channel ID for custom URL:', cleanUrl);
      
      try {
        // Try with customUrl parameter
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?` +
          `part=id,snippet&` +
          `customUrl=${cleanUrl}&` +
          `key=${process.env.YOUTUBE_API_KEY}`
        );
        
        const data = await response.json();
        console.log('Custom URL API Response:', data);
        
        if (data.items && data.items.length > 0) {
          const channelId = data.items[0].id;
          console.log('Found channel ID:', channelId);
          return NextResponse.json({ channelId });
        }
        
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
    }

    return NextResponse.json(
      { error: 'Channel not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error resolving channel:', error);
    // Log more details about the error
    if (error.response) {
      console.error('YouTube API Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    return NextResponse.json(
      { error: error.message || 'Failed to resolve channel' },
      { status: 500 }
    );
  }
} 