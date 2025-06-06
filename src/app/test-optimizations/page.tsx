'use client';

import { useState } from 'react';
import { subscriptionService } from '@/services/subscription-optimized';
import { supabaseService } from '@/services/supabase-optimized';
import { apiCache } from '@/lib/api-cache';

export default function TestOptimizationsPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('🧪 Starting optimization tests...');
      
      // Test 1: Cache System
      const cacheStartTime = Date.now();
      const testKey = 'test-cache-key';
      const testFn = () => Promise.resolve({ test: 'data', timestamp: Date.now() });
      
      const cacheResult1 = await apiCache.get(testKey, testFn, 'default');
      const cacheResult2 = await apiCache.get(testKey, testFn, 'default');
      const cacheTime = Date.now() - cacheStartTime;
      
      // Test 2: Subscription Service (Multiple calls)
      const subStartTime = Date.now();
      const subscription1 = await subscriptionService.getSubscriptionStatus();
      const subscription2 = await subscriptionService.getSubscriptionStatus();
      const subscription3 = await subscriptionService.getSubscriptionStatus();
      const subTime = Date.now() - subStartTime;
      
      // Test 3: Check if user has active subscription
      const isActive = await subscriptionService.hasActiveSubscription();
      
      // Test 4: Get cache stats
      const cacheStats = apiCache.getStats();
      
      const totalTime = Date.now() - startTime;
      
      setResults({
        success: true,
        totalExecutionTime: totalTime,
        tests: {
          cacheTest: {
            passed: cacheResult1 === cacheResult2,
            executionTime: cacheTime,
            details: 'Cache hit test - should return same object'
          },
          subscriptionTest: {
            passed: subscription1 === subscription2 && subscription2 === subscription3,
            executionTime: subTime,
            details: 'Multiple subscription calls should be cached',
            subscription: subscription1
          },
          activeSubscriptionTest: {
            passed: typeof isActive === 'boolean',
            result: isActive,
            details: 'Active subscription check'
          },
          cacheStats: {
            passed: cacheStats.size > 0,
            size: cacheStats.size,
            keys: cacheStats.keys.slice(0, 5), // Show first 5 keys
            details: 'Current cache state'
          }
        },
        allTestsPassed: 
          cacheResult1 === cacheResult2 && 
          subscription1 === subscription2 && 
          typeof isActive === 'boolean'
      });
      
      console.log('✅ Optimization tests completed successfully');
      
    } catch (error) {
      console.error('❌ Test error:', error);
      setResults({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalExecutionTime: Date.now() - startTime
      });
    }
    
    setLoading(false);
  };

  const clearCache = () => {
    apiCache.clear();
    console.log('🗑️ Cache cleared');
    setResults({ ...results, cacheCleared: true });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Optimization Tests</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Suite</h2>
        <p className="text-blue-700">
          This page tests the new optimized API services without affecting your existing application.
          Run the tests to verify caching works and performance is improved.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={runTests}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Optimization Tests'}
        </button>
        
        <button 
          onClick={clearCache}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Clear Cache
        </button>
      </div>
      
      {results.success !== undefined && (
        <div className={`border rounded-lg p-6 ${results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h3 className={`text-xl font-semibold mb-4 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
            {results.success ? '✅ Tests Passed' : '❌ Tests Failed'}
          </h3>
          
          {results.success ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Performance</h4>
                  <p className="text-sm text-gray-600">Total execution time: <span className="font-mono">{results.totalExecutionTime}ms</span></p>
                  <p className="text-sm text-gray-600">All tests passed: <span className="text-green-600 font-medium">{results.allTestsPassed ? 'Yes' : 'No'}</span></p>
                </div>
                
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2">Cache Status</h4>
                  <p className="text-sm text-gray-600">Cache size: {results.tests?.cacheStats?.size || 0} items</p>
                  <p className="text-sm text-gray-600">Active keys: {results.tests?.cacheStats?.keys?.length || 0}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Test Results</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(results.tests || {}).map(([testName, testResult]: [string, any]) => (
                    <div key={testName} className="flex justify-between items-center">
                      <span className="capitalize">{testName.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      <span className={`font-medium ${testResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <details className="bg-white p-4 rounded border">
                <summary className="font-medium text-gray-800 cursor-pointer">View Raw Results</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-red-700">
              <p className="mb-2">Error: {results.error}</p>
              <p className="text-sm">Execution time: {results.totalExecutionTime}ms</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 