'use client';

import { useState, useEffect } from 'react';
import { youtubeService } from '@/services/api/youtube';
import { SERVER_YOUTUBE_API_KEY } from '@/lib/env';
import Link from 'next/link';

// SVG components to avoid JSX escaping issues
const CheckMarkIcon = () => (
  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XMarkIcon = () => (
  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

export default function ApiKeyTestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(SERVER_YOUTUBE_API_KEY);
  const [testingWithKey, setTestingWithKey] = useState(SERVER_YOUTUBE_API_KEY);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const testApiKey = async (key: string) => {
    setIsLoading(true);
    setTestSuccess(null);
    setErrorMessage(null);
    setStatusMessage('Testing API key...');
    setTestingWithKey(key);

    try {
      // Create a temporary axios instance with the provided key
      const axios = require('axios');
      const tempApi = axios.create({
        baseURL: 'https://www.googleapis.com/youtube/v3',
        params: { key }
      });

      // Make a simple test request
      const response = await tempApi.get('/videos', {
        params: {
          part: 'id',
          chart: 'mostPopular',
          maxResults: 1
        }
      });

      if (response.status === 200) {
        setTestSuccess(true);
        setStatusMessage(`API key is working! Successfully connected to YouTube Data API v3.`);
      } else {
        setTestSuccess(false);
        setErrorMessage(`Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      setTestSuccess(false);
      let message = 'Unknown error occurred';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 403) {
          message = 'Access denied (403). ';
          
          if (data && data.error && data.error.message) {
            message += data.error.message;
          } else {
            message += 'API key may be invalid, restricted, or quota exceeded.';
          }
        } else if (status === 400) {
          message = 'Invalid request (400). API key may be malformed.';
        } else {
          message = `Error ${status}: ${data?.error?.message || 'Unknown error'}`;
        }
      } else if (error.request) {
        message = 'No response received from YouTube API. Check your internet connection.';
      } else {
        message = error.message || 'Unknown error';
      }
      
      setErrorMessage(message);
      setStatusMessage('API key test failed. See error details below.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-test the API key when the page loads
    testApiKey(SERVER_YOUTUBE_API_KEY);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    testApiKey(apiKey);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Key Test</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Environment variable <code className="bg-gray-200 px-1 rounded">SERVER_YOUTUBE_API_KEY</code></li>
        </ul>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">YouTube API Key Test</h1>
        <div>
          <Link 
            href="/dashboard" 
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Dashboard
          </Link>
        </div>
      </div>
      
      <div className="bg-gray-50 border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Key Information</h2>
        
        <div className="mb-4">
          <p className="mb-2"><strong>Current API Key:</strong></p>
          <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
            {SERVER_YOUTUBE_API_KEY || '(No API key set)'}
          </div>
        </div>
        
        <div className="mb-4">
          <p>The API key is loaded from:</p>
          <ol className="list-decimal ml-6 mt-1">
            <li>Environment variable <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_YOUTUBE_API_KEY</code></li>
            <li>Fallback in <code className="bg-gray-200 px-1 rounded">src/lib/env.ts</code></li>
          </ol>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        
        {statusMessage && (
          <div className="mb-4">
            <p><strong>Status:</strong> {statusMessage}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3">Testing API key...</p>
          </div>
        ) : (
          <>
            {testSuccess === true && (
              <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckMarkIcon />
                  </div>
                  <div className="ml-3">
                    <p className="text-green-700 font-medium">API Key is valid and working!</p>
                    <p className="text-green-600 text-sm mt-1">Successfully connected to YouTube Data API v3 with key: <span className="font-mono break-all">{testingWithKey.substring(0, 5)}...{testingWithKey.substring(testingWithKey.length - 4)}</span></p>
                  </div>
                </div>
              </div>
            )}
            
            {testSuccess === false && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <XMarkIcon />
                  </div>
                  <div className="ml-3">
                    <p className="text-red-700 font-medium">API Key test failed</p>
                    <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
                    
                    <div className="mt-3 bg-white p-3 border border-red-200 rounded text-sm">
                      <p className="font-medium mb-1">Common reasons for API key failure:</p>
                      <ul className="list-disc ml-5 text-gray-600">
                        <li>The API key is invalid or has been deleted</li>
                        <li>YouTube Data API v3 hasn't been enabled for this key</li>
                        <li>The API key has domain restrictions</li>
                        <li>The API key has reached its quota limit</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test Another API Key</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              YouTube API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter YouTube API Key..."
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Key'}
          </button>
        </form>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Create a YouTube API Key</h3>
        <ol className="list-decimal ml-5 text-sm">
          <li className="mb-1">Go to the <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
          <li className="mb-1">Create a new project or select an existing project</li>
          <li className="mb-1">Navigate to APIs &amp; Services → Library</li>
          <li className="mb-1">Search for "YouTube Data API v3" and enable it</li>
          <li className="mb-1">Go to APIs &amp; Services → Credentials</li>
          <li className="mb-1">Click "Create Credentials" and select "API Key"</li>
          <li className="mb-1">Copy your new API key and paste it in the field above</li>
          <li className="mb-1">Optionally, restrict the API key to YouTube Data API v3 only</li>
        </ol>
      </div>
    </div>
  );
} 