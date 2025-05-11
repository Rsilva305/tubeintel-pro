import { NextResponse } from 'next/server';
import { SERVER_YOUTUBE_API_KEY, hasServerYouTubeApiKey } from '@/lib/env';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Server-side cache implementation
const cache = new Map<string, { data: any, timestamp: number }>();

// Tiered cache durations for different data types
const CACHE_DURATIONS = {
  // Channel data changes infrequently - 24 hours
  CHANNEL: 24 * 60 * 60 * 1000,
  // Video metadata (stats) update more frequently - 4 hours
  VIDEO: 4 * 60 * 60 * 1000,
  // Search results may change more frequently - 2 hours
  SEARCH: 2 * 60 * 60 * 1000,
  // Video performance data is most volatile - 1 hour
  VIDEO_STATS: 1 * 60 * 60 * 1000
};

export async function fetchFromYouTubeApi(endpoint: string, params: Record<string, string>) {
  try {
    // Check if API key is configured
    if (!hasServerYouTubeApiKey) {
      console.error('YouTube API key missing or invalid:', {
        keyLength: SERVER_YOUTUBE_API_KEY?.length || 0,
        hasKey: !!SERVER_YOUTUBE_API_KEY,
        environment: process.env.NODE_ENV
      });
      return NextResponse.json(
        { error: 'YouTube API key is not configured properly' },
        { status: 500 }
      );
    }

    // Create cache key from endpoint and params
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Determine appropriate cache duration based on endpoint and params
    let cacheDuration = CACHE_DURATIONS.VIDEO; // Default to video TTL (4 hours)

    if (endpoint === 'channels') {
      cacheDuration = CACHE_DURATIONS.CHANNEL;
    } else if (endpoint === 'search') {
      cacheDuration = CACHE_DURATIONS.SEARCH;
    } else if (endpoint === 'videos' && params.chart === 'mostPopular') {
      cacheDuration = CACHE_DURATIONS.VIDEO_STATS; // Trending videos have shorter TTL
    }
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
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
    console.log('Fetching from YouTube API:', {
      endpoint,
      url: url.replace(SERVER_YOUTUBE_API_KEY, 'REDACTED'),
      params: { ...params, key: 'REDACTED' }
    });
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
        params: { ...params, key: 'REDACTED' }
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
    console.error('Server error in YouTube API request:', error);
    return NextResponse.json(
      { error: 'Internal server error processing YouTube API request' },
      { status: 500 }
    );
  }
} 