'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getEnvironmentInfo } from '@/lib/env';

export default function TestSupabasePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [resetLocalStorage, setResetLocalStorage] = useState(false);

  useEffect(() => {
    setEnvInfo(getEnvironmentInfo());
  }, []);

  const testConnection = async () => {
    setTestStatus('loading');
    try {
      // Simple test query to check if Supabase is connected
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
      
      if (error) throw error;
      
      setTestResult({
        success: true,
        message: 'Successfully connected to Supabase!',
        data: data
      });
      setTestStatus('success');
    } catch (error: any) {
      console.error('Supabase test error:', error);
      setTestResult({
        success: false,
        message: 'Failed to connect to Supabase',
        error: error.message || String(error)
      });
      setTestStatus('error');
    }
  };

  const handleClearLocalStorage = () => {
    try {
      localStorage.clear();
      setResetLocalStorage(true);
      setTimeout(() => setResetLocalStorage(false), 3000);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
          
          {envInfo && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Supabase URL:</div>
                <div>{envInfo.supabaseUrl}</div>
                
                <div className="font-medium">Supabase Key:</div>
                <div>{envInfo.supabaseKey}</div>
                
                <div className="font-medium">YouTube API Key:</div>
                <div>{envInfo.youtubeApiKey}</div>
                
                <div className="font-medium">Environment:</div>
                <div>{envInfo.isProduction ? 'Production' : 'Development'}</div>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-4">
            <button
              onClick={testConnection}
              disabled={testStatus === 'loading'}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
            >
              {testStatus === 'loading' ? 'Testing...' : 'Test Supabase Connection'}
            </button>
            
            <button
              onClick={handleClearLocalStorage}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md"
            >
              Clear LocalStorage
            </button>
          </div>
          
          {resetLocalStorage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              LocalStorage has been cleared successfully.
            </div>
          )}
          
          {testResult && (
            <div className={`border-l-4 p-4 mb-4 ${
              testResult.success 
                ? 'bg-green-100 border-green-500 text-green-700' 
                : 'bg-red-100 border-red-500 text-red-700'
            }`}>
              <p className="font-semibold">{testResult.message}</p>
              
              {testResult.error && (
                <div className="mt-2 text-sm">
                  <p>Error: {testResult.error}</p>
                  <p className="mt-2">
                    This could be due to:
                  </p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Incorrect Supabase URL or API key</li>
                    <li>Missing 'profiles' table in your database</li>
                    <li>Network connectivity issues</li>
                    <li>RLS policies blocking access</li>
                  </ul>
                </div>
              )}
              
              {testResult.success && (
                <p className="mt-2 text-sm">
                  Your Supabase database is properly connected! You can now use authentication features.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          
          <ol className="list-decimal ml-5 space-y-2">
            <li>If your connection test failed, review the <code>RESET-AUTHENTICATION.md</code> file for troubleshooting steps.</li>
            <li>Ensure you've run the SQL script to create the profiles table.</li>
            <li>Verify your Supabase project settings for authentication.</li>
            <li>Try the demo mode if you're still having issues with real authentication.</li>
          </ol>
          
          <div className="mt-6 flex space-x-4">
            <Link 
              href="/login"
              className="bg-indigo-100 text-indigo-700 py-2 px-4 rounded-md"
            >
              Back to Login
            </Link>
            <Link 
              href="/dashboard"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 