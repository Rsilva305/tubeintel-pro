'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionDebugPage() {
  const { plan, status, isSubscribed, refreshSubscription } = useSubscription();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/subscription/status');
      const data = await res.json();
      setDebugInfo(data);
    } catch (err) {
      setError('Failed to fetch subscription status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const checkFullDebug = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/debug-subscription');
      const data = await res.json();
      setDebugInfo(data);
    } catch (err) {
      setError('Failed to fetch debug info');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    if (refreshSubscription) {
      await refreshSubscription();
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Subscription Debug</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current Subscription Status</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Plan:</div>
          <div>{plan}</div>
          <div className="font-medium">Status:</div>
          <div>{status}</div>
          <div className="font-medium">Subscribed:</div>
          <div>{isSubscribed ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={checkSubscription}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Check Status API'}
        </button>
        
        <button 
          onClick={checkFullDebug}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Full Debug'}
        </button>
        
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-6">
          {error}
        </div>
      )}
      
      {debugInfo && (
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 font-medium bg-gray-50">
            Debug Information
          </div>
          <pre className="p-4 overflow-auto max-h-[500px] text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 