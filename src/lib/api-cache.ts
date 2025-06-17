/**
 * Comprehensive API Caching Layer for TubeIntel Pro
 * Provides intelligent caching for all API calls with different strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Extended TTL for stale data
  maxSize?: number; // Max entries to store
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultConfigs = {
    subscription: { ttl: 5 * 60 * 1000, staleWhileRevalidate: 30 * 60 * 1000 }, // 5min fresh, 30min stale
    profile: { ttl: 10 * 60 * 1000, staleWhileRevalidate: 60 * 60 * 1000 }, // 10min fresh, 1hr stale
    youtube_channel: { ttl: 24 * 60 * 60 * 1000, staleWhileRevalidate: 7 * 24 * 60 * 60 * 1000 }, // 24hr fresh, 7d stale
    youtube_videos: { ttl: 30 * 60 * 1000, staleWhileRevalidate: 4 * 60 * 60 * 1000 }, // 30min fresh, 4hr stale
    competitors: { ttl: 15 * 60 * 1000, staleWhileRevalidate: 60 * 60 * 1000 }, // 15min fresh, 1hr stale
    default: { ttl: 5 * 60 * 1000, staleWhileRevalidate: 15 * 60 * 1000 } // 5min fresh, 15min stale
  };

  /**
   * Get cached data or execute fetch function with caching
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    category: keyof typeof this.defaultConfigs = 'default'
  ): Promise<T> {
    const config = this.defaultConfigs[category];
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return fresh cache if available
    if (cached && now < cached.expiry) {
      return cached.data;
    }

    // If stale data is available, return it while revalidating in background
    if (cached && config.staleWhileRevalidate && now < cached.timestamp + config.staleWhileRevalidate) {
      // Return stale data immediately
      const staleData = cached.data;
      
      // Revalidate in background (non-blocking)
      this.revalidateInBackground(key, fetchFn, config);
      
      return staleData;
    }

    // No cache or expired, fetch fresh data
    return this.fetchAndCache(key, fetchFn, config);
  }

  /**
   * Fetch fresh data and cache it
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data, config);
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      const cached = this.cache.get(key);
      if (cached) {
        console.warn(`Fetch failed for ${key}, returning stale data:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Revalidate data in background (non-blocking)
   */
  private revalidateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig
  ): void {
    fetchFn()
      .then(data => this.set(key, data, config))
      .catch(error => console.warn(`Background revalidation failed for ${key}:`, error));
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, config: CacheConfig): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + config.ttl
    });
  }

  /**
   * Invalidate specific cache entries
   */
  invalidate(keyPattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(keyPattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Helper function to create cache keys
 */
export function createCacheKey(prefix: string, ...params: (string | number | undefined)[]): string {
  const cleanParams = params.filter(p => p !== undefined).map(p => String(p));
  return `${prefix}:${cleanParams.join(':')}`;
}

/**
 * Decorator for automatic API caching
 */
export function withCache<T extends any[], R>(
  category: keyof typeof apiCache['defaultConfigs'],
  keyGenerator: (...args: T) => string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args);
      return apiCache.get(cacheKey, () => originalMethod.apply(this, args), category);
    };
    
    return descriptor;
  };
} 