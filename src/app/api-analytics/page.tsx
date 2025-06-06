'use client';

import { useState, useEffect } from 'react';
import { apiUsageTracker } from '@/lib/api-usage-tracker';

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

interface EndpointAnalysis {
  endpoint: string;
  totalCalls: number;
  averageDuration: number;
  cacheHitRate: number;
  lastCalled: number;
  peakUsage: string;
}

interface OptimizationSavings {
  callReduction: number;
  timeReduction: number;
  dataReduction: number;
  estimatedCostSavings: number;
}

export default function APIAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<'session' | 'day' | 'week'>('session');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [endpointAnalysis, setEndpointAnalysis] = useState<EndpointAnalysis[]>([]);
  const [optimizationSavings, setOptimizationSavings] = useState<OptimizationSavings | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  
  useEffect(() => {
    const updateStats = () => {
      const usageStats = apiUsageTracker.getUsageStats(timeframe);
      const analysis = apiUsageTracker.getEndpointAnalysis();
      const savings = apiUsageTracker.getOptimizationSavings();
      const session = apiUsageTracker.getSessionStats();
      
      setStats(usageStats);
      setEndpointAnalysis(analysis);
      setOptimizationSavings(savings);
      setSessionStats(session);
    };

    updateStats();
    
    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const exportData = (format: 'json' | 'csv') => {
    const data = apiUsageTracker.exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${timeframe}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all API usage data? This cannot be undone.')) {
      apiUsageTracker.clearLogs();
      window.location.reload();
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">API Analytics Dashboard</h1>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">API Analytics Dashboard</h1>
          
          {/* Timeframe Selector */}
          <div className="flex gap-4 mb-6">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'session' | 'day' | 'week')}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option value="session">Current Session</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
            </select>
            
            <button
              onClick={() => exportData('json')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Export JSON
            </button>
            
            <button
              onClick={() => exportData('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
            
            <button
              onClick={clearData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total API Calls</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCalls}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cache Hit Rate</h3>
            <p className="text-3xl font-bold text-green-600">{stats.cacheHitRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Response Time</h3>
            <p className="text-3xl font-bold text-purple-600">{formatDuration(stats.averageDuration)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Transferred</h3>
            <p className="text-3xl font-bold text-orange-600">{formatBytes(stats.totalDataTransferred)}</p>
          </div>
        </div>

        {/* Session Stats */}
        {sessionStats && timeframe === 'session' && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Session Duration</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(sessionStats.sessionDuration)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pages Visited</p>
                <p className="text-2xl font-bold text-green-600">{sessionStats.uniquePages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Calls per Minute</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sessionStats.averageCallsPerMinute.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Savings */}
        {optimizationSavings && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Optimization Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Calls Saved</p>
                <p className="text-2xl font-bold text-green-600">
                  {optimizationSavings.callReduction}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Saved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(optimizationSavings.timeReduction)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Saved</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatBytes(optimizationSavings.dataReduction)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Savings</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${optimizationSavings.estimatedCostSavings}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calls by Endpoint */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Calls by Endpoint</h3>
            <div className="space-y-3">
              {Object.entries(stats.callsByEndpoint)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([endpoint, count]) => (
                <div key={endpoint} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-4">{endpoint}</span>
                  <span className="font-semibold text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Calls by Page</h3>
            <div className="space-y-3">
              {Object.entries(stats.callsByPage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([page, count]) => (
                <div key={page} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-4">
                    {page || '/'}
                  </span>
                  <span className="font-semibold text-green-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Endpoint Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Endpoint Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Endpoint</th>
                  <th className="text-right py-2">Total Calls</th>
                  <th className="text-right py-2">Avg Duration</th>
                  <th className="text-right py-2">Cache Hit Rate</th>
                  <th className="text-right py-2">Peak Usage</th>
                  <th className="text-right py-2">Last Called</th>
                </tr>
              </thead>
              <tbody>
                {endpointAnalysis.map((endpoint) => (
                  <tr key={endpoint.endpoint} className="border-b">
                    <td className="py-2 text-gray-600 truncate max-w-xs">
                      {endpoint.endpoint}
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {endpoint.totalCalls}
                    </td>
                    <td className="py-2 text-right">
                      {formatDuration(endpoint.averageDuration)}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        endpoint.cacheHitRate > 80 
                          ? 'bg-green-100 text-green-800'
                          : endpoint.cacheHitRate > 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {endpoint.cacheHitRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right">{endpoint.peakUsage}</td>
                    <td className="py-2 text-right text-gray-500">
                      {new Date(endpoint.lastCalled).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage by Hour */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage by Hour</h3>
          <div className="grid grid-cols-12 gap-2">
            {Array.from({length: 24}, (_, i) => {
              const hour = `${i}:00`;
              const count = stats.callsByHour[hour] || 0;
              const maxCount = Math.max(...Object.values(stats.callsByHour));
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={hour} className="flex flex-col items-center">
                  <div 
                    className="bg-blue-500 w-full min-h-[4px] rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${hour}: ${count} calls`}
                  />
                  <span className="text-xs text-gray-500 mt-1">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 