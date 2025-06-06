/**
 * Manual API Measurement Utility
 * Use this to measure API usage before and after optimizations
 */

// Simple console-based API call tracker
export const measureAPIUsage = {
  calls: [] as Array<{
    url: string;
    method: string;
    timestamp: number;
    duration?: number;
    page: string;
    cached?: boolean;
  }>,

  // Start measuring API calls
  startMeasuring() {
    if (typeof window === 'undefined') return;

    console.log('🔍 Starting API usage measurement...');
    
    // Override fetch to track calls
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const startTime = Date.now();
      const url = args[0] as string;
      const method = (args[1]?.method || 'GET').toUpperCase();
      
      // Only track API calls
      if (url.includes('/api/')) {
        measureAPIUsage.calls.push({
          url,
          method,
          timestamp: startTime,
          page: window.location.pathname,
        });
        
        console.log(`📡 API Call: ${method} ${url}`);
      }

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Update with duration
        if (url.includes('/api/')) {
          const lastCall = measureAPIUsage.calls[measureAPIUsage.calls.length - 1];
          if (lastCall && lastCall.url === url) {
            lastCall.duration = duration;
          }
          console.log(`✅ API Response: ${method} ${url} (${duration}ms)`);
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (url.includes('/api/')) {
          const lastCall = measureAPIUsage.calls[measureAPIUsage.calls.length - 1];
          if (lastCall && lastCall.url === url) {
            lastCall.duration = duration;
          }
          console.log(`❌ API Error: ${method} ${url} (${duration}ms)`);
        }
        
        throw error;
      }
    };
  },

  // Get current statistics
  getStats() {
    const totalCalls = this.calls.length;
    const uniqueEndpoints = Array.from(new Set(this.calls.map(call => call.url)));
    const averageTime = this.calls.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls;
    
    // Group by endpoint
    const callsByEndpoint: Record<string, number> = {};
    this.calls.forEach(call => {
      const endpoint = call.url.split('?')[0];
      callsByEndpoint[endpoint] = (callsByEndpoint[endpoint] || 0) + 1;
    });

    // Group by page
    const callsByPage: Record<string, number> = {};
    this.calls.forEach(call => {
      callsByPage[call.page] = (callsByPage[call.page] || 0) + 1;
    });

    return {
      totalCalls,
      uniqueEndpoints: uniqueEndpoints.length,
      averageTime: Math.round(averageTime),
      callsByEndpoint,
      callsByPage,
      calls: this.calls
    };
  },

  // Print detailed report
  printReport() {
    const stats = this.getStats();
    
    console.log('\n📊 API Usage Report');
    console.log('='.repeat(50));
    console.log(`Total API Calls: ${stats.totalCalls}`);
    console.log(`Unique Endpoints: ${stats.uniqueEndpoints}`);
    console.log(`Average Response Time: ${stats.averageTime}ms`);
    
    console.log('\n📈 Calls by Endpoint:');
    Object.entries(stats.callsByEndpoint)
      .sort(([,a], [,b]) => b - a)
      .forEach(([endpoint, count]) => {
        console.log(`  ${endpoint}: ${count} calls`);
      });
      
    console.log('\n📄 Calls by Page:');
    Object.entries(stats.callsByPage)
      .sort(([,a], [,b]) => b - a)
      .forEach(([page, count]) => {
        console.log(`  ${page}: ${count} calls`);
      });

    return stats;
  },

  // Export data as CSV
  exportCSV() {
    const headers = 'Timestamp,URL,Method,Duration,Page\n';
    const rows = this.calls.map(call => 
      `${new Date(call.timestamp).toISOString()},${call.url},${call.method},${call.duration || 0},${call.page}`
    ).join('\n');
    
    const csv = headers + rows;
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Clear measurements
  clear() {
    this.calls = [];
    console.log('🗑️ API measurements cleared');
  }
};

// Browser DevTools helper functions
export const devToolsHelpers = {
  // Count network requests in DevTools
  instructions: `
🔧 How to measure API calls manually:

METHOD 1: Browser DevTools (Recommended)
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR" 
4. Navigate through your app
5. Count requests to your API endpoints

METHOD 2: Console Tracking
1. Open DevTools Console
2. Run: measureAPIUsage.startMeasuring()
3. Navigate through your app
4. Run: measureAPIUsage.printReport()

METHOD 3: Performance Tab
1. Open DevTools Performance tab
2. Start recording
3. Navigate through your app
4. Stop recording
5. Analyze network activity

WHAT TO MEASURE:
- Dashboard page load
- Settings page visit
- Competitors page visit
- User actions (creating lists, etc.)

EXPECTED IMPROVEMENTS:
- Before optimization: 8-12 subscription calls per page
- After optimization: 1 subscription call per 5 minutes
- 70-90% reduction in total API calls
`,

  // Quick measurement script
  measureCurrentPage() {
    if (typeof window === 'undefined') return;
    
    console.log('🎯 Measuring current page API usage...');
    
    // Count existing requests
    const performanceEntries = performance.getEntriesByType('navigation');
    console.log('Performance entries:', performanceEntries);
    
    // Start fresh measurement
    measureAPIUsage.clear();
    measureAPIUsage.startMeasuring();
    
    console.log(`
📋 Instructions:
1. Interact with the page (click buttons, navigate, etc.)
2. Wait 30 seconds
3. Run: measureAPIUsage.printReport()
4. Compare with optimized version
    `);
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  (window as any).measureAPIUsage = measureAPIUsage;
  (window as any).devToolsHelpers = devToolsHelpers;
} 