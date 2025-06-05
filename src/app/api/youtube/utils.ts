import { NextResponse } from 'next/server';

const RAPID_API_HOST = process.env.RAPID_API_HOST || 'youtube-v311.p.rapidapi.com';
const RAPID_API_KEY = process.env.RAPID_API_KEY;

if (!RAPID_API_KEY) {
  console.error('RapidAPI key is not configured. Please set RAPID_API_KEY in your environment variables.');
}

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
    if (!RAPID_API_KEY) {
      return NextResponse.json(
        { error: 'RapidAPI key is not configured' },
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
        // Build URL with parameters
        const searchParams = new URLSearchParams(params);
        const url = `https://${RAPID_API_HOST}/${endpoint}?${searchParams.toString()}`;
        
        // Make the request with RapidAPI headers
        console.log('Fetching from RapidAPI YouTube:', {
          endpoint,
          url,
          params
        });
        
        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': RAPID_API_HOST
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('RapidAPI YouTube Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            endpoint,
            params
          });
          
          // If quota exceeded (429) and we have stale data, use it
          if (response.status === 429 && isStaleData) {
            console.log('Using stale cached data due to quota limits. Data age:', Math.round(dataAge / (60 * 60 * 1000)), 'hours');
            // Update timestamp to reduce frequency of future API calls during quota error
            cache.set(cacheKey, {
              data: cachedData.data,
              timestamp: now - (cacheDuration / 2) // Set to half-expired to retry sooner than full extended duration
            });
            return NextResponse.json(cachedData.data);
          }
          
          return NextResponse.json(
            { error: `RapidAPI YouTube Error: ${response.statusText}`, details: errorData },
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
    
    // Build URL with parameters
    const searchParams = new URLSearchParams(params);
    const url = `https://${RAPID_API_HOST}/${endpoint}?${searchParams.toString()}`;
    
    // Make the request with RapidAPI headers
    console.log('Fetching from RapidAPI YouTube:', {
      endpoint,
      url,
      params
    });
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': RAPID_API_HOST
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('RapidAPI YouTube Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint,
        params
      });
      
      return NextResponse.json(
        { error: `RapidAPI YouTube Error: ${response.statusText}`, details: errorData },
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
    console.error('Server error in RapidAPI YouTube request:', error);
    return NextResponse.json(
      { error: 'Internal server error processing RapidAPI YouTube request' },
      { status: 500 }
    );
  }
} 