'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getEnvironmentInfo } from '@/lib/env';

export default function SupabaseTestPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState<any>(null);
  
  useEffect(() => {
    // Get environment info
    setEnvInfo(getEnvironmentInfo());
    
    // Test Supabase connection and authentication
    async function testSupabase() {
      try {
        // First check if user exists in localStorage
        const storedUser = localStorage.getItem('user');
        console.log("User in localStorage:", storedUser ? JSON.parse(storedUser) : 'None');
        
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
        
        // Test Supabase connection with a simple query
        console.log("Testing Supabase connection...");
        const { data, error } = await supabase
          .from('competitor_lists')
          .select('count', { count: 'exact', head: true });
          
        if (error) {
          console.error("Supabase connection error:", error);
          setSupabaseStatus('error');
          setError(`Connection error: ${error.message} (${error.code})`);
          return;
        }
        
        console.log("Supabase connection successful:", data);
        setSupabaseStatus('connected');
        
        // Try to get the current session
        console.log("Checking Supabase auth session...");
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          console.log("User authenticated:", sessionData.session.user);
          setCurrentUser(sessionData.session.user);
        } else {
          console.log("No Supabase session found");
        }
        
      } catch (err: any) {
        console.error("Error in Supabase test:", err);
        setSupabaseStatus('error');
        setError(err.message || 'Unknown error');
      }
    }
    
    testSupabase();
  }, []);
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Test Page</h1>
      
      {/* Environment Info */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
        <pre className="text-sm bg-white dark:bg-gray-900 p-3 rounded overflow-auto">
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Supabase Connection</h2>
        
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            supabaseStatus === 'connected' ? 'bg-green-500' : 
            supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span>
            {supabaseStatus === 'connected' ? 'Connected' : 
             supabaseStatus === 'error' ? 'Connection Error' : 'Checking...'}
          </span>
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* User Info */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current User</h2>
        
        {currentUser ? (
          <pre className="text-sm bg-white dark:bg-gray-900 p-3 rounded overflow-auto">
            {JSON.stringify(currentUser, null, 2)}
          </pre>
        ) : (
          <p className="italic text-gray-500">No authenticated user found</p>
        )}
        
        <div className="mt-4 space-y-2">
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('youtubeChannelId');
              window.location.reload();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Clear User from localStorage
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
      
      {/* Manual Authentication */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Manual Auth Test</h2>
        
        <button 
          onClick={async () => {
            try {
              // Demo user data - this should normally come from a real login
              const mockUser = {
                id: '12345-test-user-id',
                email: 'test@example.com',
                username: 'testuser',
                createdAt: new Date().toISOString(),
                hasCompletedOnboarding: true
              };
              
              // Save to localStorage
              localStorage.setItem('user', JSON.stringify(mockUser));
              
              // Reload the page to test if the data is persisted
              window.location.reload();
            } catch (err: any) {
              alert(`Error: ${err.message}`);
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Set Test User in localStorage
        </button>
      </div>
    </div>
  );
} 