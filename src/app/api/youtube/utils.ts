import { NextResponse } from 'next/server';
import { SERVER_YOUTUBE_API_KEY, hasServerYouTubeApiKey } from '@/lib/env';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Server-side cache implementation
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export async function fetchFromYouTubeApi(endpoint: string, params: Record<string, string>) {
  try {
    // Check if API key is configured
    if (!hasServerYouTubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API key is not configured properly' },
        { status: 500 }
      );
    }

    // Create cache key from endpoint and params
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log('Using cached data for:', cacheKey);
      return NextResponse.json(cachedData.data);
    }

    // Build URL with parameters and API key
    const searchParams = new URLSearchParams({
      ...params,
      key: SERVER_YOUTUBE_API_KEY
    });
    
    const url = `${BASE_URL}/${endpoint}?${searchParams.toString()}`;
    
    // Make the request
    console.log('Fetching from YouTube API:', endpoint);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return NextResponse.json(
        { error: `YouTube API Error: ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from YouTube API:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching data from YouTube API' },
      { status: 500 }
    );
  }
} 