'use client';

import { useState, useEffect } from 'react';
import { getEnvironmentInfo } from '@/lib/env';

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [clientEnvs, setClientEnvs] = useState<any>({});

  useEffect(() => {
    // Get server-side environment info
    const serverInfo = getEnvironmentInfo();
    setEnvInfo(serverInfo);

    // Check client-side environment variables
    setClientEnvs({
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_YOUTUBE_API_KEY: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      NEXT_PUBLIC_USE_REAL_API: process.env.NEXT_PUBLIC_USE_REAL_API,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    });
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Environment Debug Page</h1>
      
      <div className="grid gap-6">
        {/* Environment Detection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Detection</h2>
          <div className="space-y-2">
            <p><strong>Is Browser:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Is Production:</strong> {envInfo?.isProduction ? 'Yes' : 'No'}</p>
            <p><strong>VERCEL_URL:</strong> {process.env.VERCEL_URL || 'Not set'}</p>
          </div>
        </div>

        {/* Server Environment Info */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Server Environment Info</h2>
          {envInfo ? (
            <div className="space-y-2">
              <p><strong>Supabase URL:</strong> {envInfo.supabaseUrl}</p>
              <p><strong>Supabase Key:</strong> {envInfo.supabaseKey}</p>
              <p><strong>YouTube API Key:</strong> {envInfo.serverYoutubeApiKey}</p>
              <p><strong>Has Supabase Config:</strong> {envInfo.hasSupabaseConfig ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        {/* Client Environment Variables */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Client Environment Variables</h2>
          <div className="space-y-2">
            {Object.entries(clientEnvs).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {typeof value === 'boolean' ? (value ? 'Set' : 'Not set') : String(value)}
              </p>
            ))}
          </div>
        </div>

        {/* API Configuration Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-2">
            <p><strong>USE_REAL_API Environment:</strong> {process.env.NEXT_PUBLIC_USE_REAL_API || 'Not set'}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
          </div>
        </div>

        {/* Test API Call */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <button 
            onClick={() => {
              fetch('/api/videos/sync')
                .then(res => res.json())
                .then(data => console.log('API Test Result:', data))
                .catch(err => console.error('API Test Error:', err));
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Sync API
          </button>
          <p className="text-sm text-gray-600 mt-2">Check browser console for results</p>
        </div>
      </div>
    </div>
  );
} 