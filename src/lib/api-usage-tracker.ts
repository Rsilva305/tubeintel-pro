/**
 * API Usage Tracker
 * Tracks API calls across different dimensions for optimization analysis
 */

interface APICallLog {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  pageUrl: string;
  cacheHit: boolean;
  status: number;
  size?: number;
}

interface UsageStats {
  totalCalls: number;
  uniqueEndpoints: string[];
  averageDuration: number;
  cacheHitRate: number;
  callsByEndpoint: Record<string, number>;
  callsByPage: Record<string, number>;
  callsByHour: Record<string, number>;
  totalDataTransferred: number;
}

class APIUsageTracker {
  private static instance: APIUsageTracker;
  private logs: APICallLog[] = [];
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Load existing logs from localStorage
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('api_usage_logs');
      if (savedLogs) {
        try {
          this.logs = JSON.parse(savedLogs);
        } catch (error) {
          console.error('Error loading API usage logs:', error);
        }
      }
    }
  }

  static getInstance(): APIUsageTracker {
    if (!APIUsageTracker.instance) {
      APIUsageTracker.instance = new APIUsageTracker();
    }
    return APIUsageTracker.instance;
  }

  /**
   * Track an API call
   */
  trackAPICall(
    endpoint: string,
    method: string = 'GET',
    duration: number,
    options: {
      cacheHit?: boolean;
      status?: number;
      size?: number;
      userId?: string;
    } = {}
  ): void {
    const log: APICallLog = {
      endpoint: this.normalizeEndpoint(endpoint),
      method,
      duration,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
      cacheHit: options.cacheHit || false,
      status: options.status || 200,
      size: options.size,
      userId: options.userId
    };

    this.logs.push(log);
    this.saveLogs();

    // Clean old logs (keep last 7 days)
    this.cleanOldLogs();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 API Call: ${endpoint} (${duration}ms)${options.cacheHit ? ' [CACHED]' : ''}`);
    }
  }

  /**
   * Get usage statistics for different time periods
   */
  getUsageStats(timeframe: 'session' | 'day' | 'week' = 'session'): UsageStats {
    const filteredLogs = this.filterLogsByTimeframe(timeframe);
    
    const totalCalls = filteredLogs.length;
    const uniqueEndpoints = Array.from(new Set(filteredLogs.map(log => log.endpoint)));
    const averageDuration = totalCalls > 0 
      ? filteredLogs.reduce((sum, log) => sum + log.duration, 0) / totalCalls 
      : 0;
    
    const cacheHits = filteredLogs.filter(log => log.cacheHit).length;
    const cacheHitRate = totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0;

    const callsByEndpoint: Record<string, number> = {};
    const callsByPage: Record<string, number> = {};
    const callsByHour: Record<string, number> = {};
    let totalDataTransferred = 0;

    filteredLogs.forEach(log => {
      // By endpoint
      callsByEndpoint[log.endpoint] = (callsByEndpoint[log.endpoint] || 0) + 1;
      
      // By page
      callsByPage[log.pageUrl] = (callsByPage[log.pageUrl] || 0) + 1;
      
      // By hour
      const hour = new Date(log.timestamp).getHours();
      const hourKey = `${hour}:00`;
      callsByHour[hourKey] = (callsByHour[hourKey] || 0) + 1;
      
      // Data transfer
      if (log.size) {
        totalDataTransferred += log.size;
      }
    });

    return {
      totalCalls,
      uniqueEndpoints,
      averageDuration,
      cacheHitRate,
      callsByEndpoint,
      callsByPage,
      callsByHour,
      totalDataTransferred
    };
  }

  /**
   * Get detailed breakdown by endpoint
   */
  getEndpointAnalysis(): Array<{
    endpoint: string;
    totalCalls: number;
    averageDuration: number;
    cacheHitRate: number;
    lastCalled: number;
    peakUsage: string;
  }> {
    const endpointStats: Record<string, {
      calls: APICallLog[];
      totalCalls: number;
    }> = {};

    // Group by endpoint
    this.logs.forEach(log => {
      if (!endpointStats[log.endpoint]) {
        endpointStats[log.endpoint] = { calls: [], totalCalls: 0 };
      }
      endpointStats[log.endpoint].calls.push(log);
      endpointStats[log.endpoint].totalCalls++;
    });

    return Object.entries(endpointStats).map(([endpoint, stats]) => {
      const calls = stats.calls;
      const totalCalls = stats.totalCalls;
      const averageDuration = calls.reduce((sum, call) => sum + call.duration, 0) / totalCalls;
      const cacheHits = calls.filter(call => call.cacheHit).length;
      const cacheHitRate = (cacheHits / totalCalls) * 100;
      const lastCalled = Math.max(...calls.map(call => call.timestamp));
      
      // Find peak usage hour
      const hourCounts: Record<number, number> = {};
      calls.forEach(call => {
        const hour = new Date(call.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const peakHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '0';
      
      return {
        endpoint,
        totalCalls,
        averageDuration: Math.round(averageDuration),
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        lastCalled,
        peakUsage: `${peakHour}:00`
      };
    }).sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Calculate optimization savings
   */
  getOptimizationSavings(): {
    callReduction: number;
    timeReduction: number;
    dataReduction: number;
    estimatedCostSavings: number;
  } {
    const stats = this.getUsageStats('day');
    const cacheHitRate = stats.cacheHitRate / 100;
    
    // Estimate calls that would have been made without caching
    const originalCalls = stats.totalCalls / (1 - cacheHitRate);
    const callReduction = originalCalls - stats.totalCalls;
    
    // Estimate time savings (assuming cached calls save ~500ms on average)
    const timeReduction = callReduction * 500;
    
    // Estimate data savings (assuming average response size of 5KB)
    const dataReduction = callReduction * 5 * 1024; // bytes
    
    // Estimate cost savings (rough calculation based on API pricing)
    const estimatedCostSavings = callReduction * 0.001; // $0.001 per API call
    
    return {
      callReduction: Math.round(callReduction),
      timeReduction: Math.round(timeReduction),
      dataReduction: Math.round(dataReduction),
      estimatedCostSavings: Math.round(estimatedCostSavings * 100) / 100
    };
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'Timestamp,Endpoint,Method,Duration,Page,CacheHit,Status,SessionId\n';
      const rows = this.logs.map(log => 
        `${new Date(log.timestamp).toISOString()},${log.endpoint},${log.method},${log.duration},${log.pageUrl},${log.cacheHit},${log.status},${log.sessionId}`
      ).join('\n');
      return headers + rows;
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_usage_logs');
    }
  }

  /**
   * Get real-time stats for current session
   */
  getSessionStats() {
    const sessionLogs = this.logs.filter(log => log.sessionId === this.sessionId);
    const sessionDuration = Date.now() - this.startTime;
    
    return {
      sessionDuration: sessionDuration,
      totalCalls: sessionLogs.length,
      uniquePages: Array.from(new Set(sessionLogs.map(log => log.pageUrl))).length,
      averageCallsPerMinute: sessionLogs.length / (sessionDuration / 60000),
      cacheHitRate: sessionLogs.filter(log => log.cacheHit).length / sessionLogs.length * 100
    };
  }

  // Private methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeEndpoint(endpoint: string): string {
    // Remove query parameters and normalize
    return endpoint.split('?')[0].replace(/\/+$/, '');
  }

  private filterLogsByTimeframe(timeframe: 'session' | 'day' | 'week'): APICallLog[] {
    const now = Date.now();
    let cutoff: number;

    switch (timeframe) {
      case 'session':
        return this.logs.filter(log => log.sessionId === this.sessionId);
      case 'day':
        cutoff = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = 0;
    }

    return this.logs.filter(log => log.timestamp > cutoff);
  }

  private saveLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('api_usage_logs', JSON.stringify(this.logs));
      } catch (error) {
        console.error('Error saving API usage logs:', error);
      }
    }
  }

  private cleanOldLogs(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > sevenDaysAgo);
  }
}

// Export singleton instance
export const apiUsageTracker = APIUsageTracker.getInstance();

/**
 * Hook to automatically track fetch requests
 */
export function trackFetchCalls() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const startTime = Date.now();
    const url = args[0] as string;
    const options = args[1] || {};
    
    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;
      
      // Only track our API calls
      if (url.includes('/api/')) {
        apiUsageTracker.trackAPICall(url, options.method || 'GET', duration, {
          status: response.status,
          size: parseInt(response.headers.get('content-length') || '0'),
          cacheHit: response.headers.get('x-cache') === 'HIT' // If your API sets this header
        });
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (url.includes('/api/')) {
        apiUsageTracker.trackAPICall(url, options.method || 'GET', duration, {
          status: 500,
          cacheHit: false
        });
      }
      
      throw error;
    }
  };
}

// Auto-initialize tracking
if (typeof window !== 'undefined') {
  trackFetchCalls();
} 