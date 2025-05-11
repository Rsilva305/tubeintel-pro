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
      console.log('Getting channel ID for username:', cleanUsername);
      
      try {
        const channelId = await youtubeService.getChannelIdByUsername(cleanUsername);
        console.log('Found channel ID:', channelId);
        return NextResponse.json({ channelId });
      } catch (error) {
        console.error('Error getting channel ID:', error);
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
        const channelId = await youtubeService.getChannelIdByUsername(cleanUrl);
        console.log('Found channel ID:', channelId);
        return NextResponse.json({ channelId });
      } catch (error) {
        console.error('Error getting channel ID:', error);
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