import { NextResponse } from 'next/server';

const RAPID_API_HOST = process.env.RAPID_API_HOST || 'youtube-v311.p.rapidapi.com';
const RAPID_API_KEY = process.env.RAPID_API_KEY;

// Rate limiter configuration
const RATE_LIMIT = 5; // 5 requests per second
const RATE_WINDOW = 1000; // 1 second in milliseconds
let requestQueue: { resolve: () => void }[] = [];
let requestsInWindow = 0;
let windowStart = Date.now();

// Rate limiter function
async function acquireRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Reset window if it's expired
  if (now - windowStart >= RATE_WINDOW) {
    console.log(`Rate limit window reset. Processed ${requestsInWindow} requests in previous window.`);
    requestsInWindow = 0;
    windowStart = now;
  }
  
  // If we're under the limit, allow immediately
  if (requestsInWindow < RATE_LIMIT) {
    requestsInWindow++;
    console.log(`Request allowed immediately. Current window: ${requestsInWindow}/${RATE_LIMIT} requests`);
    return Promise.resolve();
  }
  
  // Otherwise, queue the request
  console.log(`Rate limit reached. Queueing request. Queue length: ${requestQueue.length + 1}`);
  return new Promise<void>(resolve => {
    requestQueue.push({ resolve });
    
    // Set timeout to process queue in the next window
    setTimeout(() => {
      processQueue();
    }, RATE_WINDOW - (now - windowStart));
  });
}

// Process queued requests
function processQueue() {
  const now = Date.now();
  windowStart = now;
  requestsInWindow = 0;
  
  const queueLength = requestQueue.length;
  console.log(`Processing queue. ${queueLength} requests waiting.`);
  
  // Process as many requests as we can in the new window
  while (requestQueue.length > 0 && requestsInWindow < RATE_LIMIT) {
    const request = requestQueue.shift();
    if (request) {
      requestsInWindow++;
      request.resolve();
    }
  }
  
  const processed = queueLength - requestQueue.length;
  console.log(`Processed ${processed} queued requests. ${requestQueue.length} remaining in queue.`);
  
  // If there are remaining requests, schedule them for the next window
  if (requestQueue.length > 0) {
    console.log(`Scheduling remaining ${requestQueue.length} requests for next window`);
    setTimeout(() => {
      processQueue();
    }, RATE_WINDOW);
  }
}

if (!RAPID_API_KEY) {
  console.error('RapidAPI key is not configured. Please set RAPID_API_KEY in your environment variables.');
}

// Server-side cache implementation
const cache = new Map<string, { data: any, timestamp: number }>();

// Tiered cache durations for different data types
const CACHE_DURATIONS = {
  // Channel data changes infrequently - 24 hours
  CHANNEL: 24 * 60 * 60 * 1000,
  // Video metadata (stats) update more frequently - 30 minutes
  VIDEO: 30 * 60 * 1000,
  // Search results may change more frequently - 15 minutes
  SEARCH: 15 * 60 * 1000,
  // Video performance data is most volatile - 15 minutes
  VIDEO_STATS: 15 * 60 * 1000
};

// Extended cache durations for quota exceeded situations
const EXTENDED_CACHE_DURATIONS = {
  CHANNEL: 7 * 24 * 60 * 60 * 1000, // 7 days
  VIDEO: 4 * 60 * 60 * 1000,        // 4 hours
  SEARCH: 2 * 60 * 60 * 1000,       // 2 hours
  VIDEO_STATS: 1 * 60 * 60 * 1000   // 1 hour
};

export async function fetchFromYouTubeApi(endpoint: string, params: Record<string, string>) {
  try {
    if (!RAPID_API_KEY) {
      return NextResponse.json(
        { error: 'RapidAPI key is not configured' },
        { status: 500 }
      );
    }

    // Wait for rate limit before proceeding
    await acquireRateLimit();

    // Create cache key from endpoint and params
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Determine appropriate cache duration based on endpoint and params
    let cacheDuration = CACHE_DURATIONS.VIDEO; // Default to video TTL (30 minutes)
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