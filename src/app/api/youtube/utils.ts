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

// Extended cache durations for quota exceeded situations
const EXTENDED_CACHE_DURATIONS = {
  CHANNEL: 7 * 24 * 60 * 60 * 1000, // 7 days
  VIDEO: 24 * 60 * 60 * 1000,       // 24 hours
  SEARCH: 12 * 60 * 60 * 1000,      // 12 hours
  VIDEO_STATS: 4 * 60 * 60 * 1000   // 4 hours
};

export async function fetchFromYouTubeApi(endpoint: string, params: Record<string, string>) {
  try {
    // Check if API key is configured
    if (!hasServerYouTubeApiKey) {
      console.error('YouTube API key missing or invalid:', {
        keyLength: SERVER_YOUTUBE_API_KEY?.length || 0,
        hasKey: !!SERVER_YOUTUBE_API_KEY,
        environment: process.env.NODE_ENV,
        keyPrefix: SERVER_YOUTUBE_API_KEY?.substring(0, 5) || 'none',
        keySuffix: SERVER_YOUTUBE_API_KEY?.substring(SERVER_YOUTUBE_API_KEY.length - 5) || 'none'
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
    let extendedCacheDuration = EXTENDED_CACHE_DURATIONS.VIDEO;

    if (endpoint === 'channels') {
      cacheDuration = CACHE_DURATIONS.CHANNEL;
      extendedCacheDuration = EXTENDED_CACHE_DURATIONS.CHANNEL;
    } else if (endpoint === 'search') {
      cacheDuration = CACHE_DURATIONS.SEARCH;
      extendedCacheDuration = EXTENDED_CACHE_DURATIONS.SEARCH;
    } else if (endpoint === 'videos' && params.chart === 'mostPopular') {
      cacheDuration = CACHE_DURATIONS.VIDEO_STATS;
      extendedCacheDuration = EXTENDED_CACHE_DURATIONS.VIDEO_STATS;
    }
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData) {
      const dataAge = now - cachedData.timestamp;
      
      // Use cache if within normal TTL
      if (dataAge < cacheDuration) {
        console.log('Using cached data for:', cacheKey);
        return NextResponse.json(cachedData.data);
      }
      
      // Flag to track if this is stale but usable data
      let isStaleData = false;
      
      // If data is expired but within extended TTL, we'll try to refresh it
      // but keep it as a fallback in case of quota errors
      if (dataAge < extendedCacheDuration) {
        isStaleData = true;
      }
      
      try {
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
          
          // If quota exceeded (403) and we have stale data, use it
          if (response.status === 403 && isStaleData) {
            console.log('Using stale cached data due to quota limits. Data age:', Math.round(dataAge / (60 * 60 * 1000)), 'hours');
            // Update timestamp to reduce frequency of future API calls during quota error
            cache.set(cacheKey, {
              data: cachedData.data,
              timestamp: now - (cacheDuration / 2) // Set to half-expired to retry sooner than full extended duration
            });
            return NextResponse.json(cachedData.data);
          }
          
          return NextResponse.json(
            { error: `YouTube API Error: ${response.statusText}`, details: errorData },
            { status: response.status }
          );
        }
        
        const data = await response.json();
        
        // Cache the response
        cache.set(cacheKey, {
          data,
          timestamp: now
        });
        
        return NextResponse.json(data);
      } catch (error) {
        // If any error occurs during fetching and we have stale data, use it
        if (isStaleData) {
          console.log('Using stale cached data due to error. Data age:', Math.round(dataAge / (60 * 60 * 1000)), 'hours');
          return NextResponse.json(cachedData.data);
        }
        throw error; // Re-throw if we don't have usable cached data
      }
    }
    
    // No cache or expired cache beyond extended TTL, must fetch fresh data
    
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
      timestamp: now
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