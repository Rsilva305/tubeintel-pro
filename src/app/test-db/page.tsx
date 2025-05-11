'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import Link from 'next/link';
import DebugComponent from './debug';
import SupabaseTest from './supabase-test';

type TestResult = {
  status: 'success' | 'error';
  details: string;
  data?: any;
  error?: any;
  user?: any;
};

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const runTests = async () => {
      try {
        setIsLoading(true);
        const results: Record<string, any> = {};
        
        // Check user authentication
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        results.authentication = {
          status: currentUser ? 'success' : 'error',
          details: currentUser ? 'User authenticated' : 'No user found',
          user: currentUser
        };
        
        // Test competitor_lists table
        try {
          const { data: listTablesData, error: listTablesError } = await supabase
            .from('competitor_lists')
            .select('count', { count: 'exact', head: true });
            
          results.competitor_lists_table = {
            status: listTablesError ? 'error' : 'success',
            details: listTablesError 
              ? `Error: ${listTablesError.message}`
              : `Table exists, count operation successful`,
            error: listTablesError
          };
          
          if (!listTablesError && currentUser) {
            // Try to create a test list
            const testListName = `Test List ${new Date().toISOString()}`;
            const { data: createData, error: createError } = await supabase
              .from('competitor_lists')
              .insert([{
                name: testListName,
                description: 'Test list created for database testing',
                user_id: currentUser.id
              }])
              .select();
              
            results.create_list = {
              status: createError ? 'error' : 'success',
              details: createError 
                ? `Error creating test list: ${createError.message}`
                : `Successfully created test list`,
              data: createData,
              error: createError
            };
            
            // If creation was successful, try to delete it
            if (!createError && createData && createData.length > 0) {
              const listId = createData[0].id;
              if (typeof listId !== 'string' && typeof listId !== 'number') {
                console.error('Invalid list ID:', listId);
                results.delete_list = {
                  status: 'error',
                  details: 'Invalid list ID type',
                  error: new Error('Invalid list ID type')
                };
              } else {
                const { error: deleteError } = await supabase
                  .from('competitor_lists')
                  .delete()
                  .eq('id', listId);
                  
                results.delete_list = {
                  status: deleteError ? 'error' : 'success',
                  details: deleteError 
                    ? `Error deleting test list: ${deleteError.message}`
                    : `Successfully deleted test list`,
                  error: deleteError
                };
              }
            }
          }
        } catch (listError) {
          results.competitor_lists_table = {
            status: 'error',
            details: `Exception: ${listError instanceof Error ? listError.message : String(listError)}`,
            error: listError
          };
        }
        
        // Test profiles table
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });
            
          results.profiles_table = {
            status: profilesError ? 'error' : 'success',
            details: profilesError 
              ? `Error: ${profilesError.message}`
              : `Table exists, count operation successful`,
            error: profilesError
          };
          
          if (!profilesError && currentUser) {
            // Check if current user has a profile
            const { data: userProfile, error: userProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle();
              
            results.user_profile = {
              status: userProfileError ? 'error' : 'success',
              details: userProfileError 
                ? `Error checking user profile: ${userProfileError.message}`
                : userProfile ? `User profile found` : `No profile found for this user`,
              data: userProfile,
              error: userProfileError
            };
          }
        } catch (profilesError) {
          results.profiles_table = {
            status: 'error',
            details: `Exception: ${profilesError instanceof Error ? profilesError.message : String(profilesError)}`,
            error: profilesError
          };
        }
        
        setTestResults(results);
      } catch (e) {
        setError(`Error running tests: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    runTests();
  }, []);
  
  const fixMissingTables = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if competitor_lists table exists
      if (testResults.competitor_lists_table?.status === 'error') {
        // Create the table
        const { error: createTableError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Create a table for competitor lists
            CREATE TABLE IF NOT EXISTS public.competitor_lists (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create a table for tracked competitors
            CREATE TABLE IF NOT EXISTS public.tracked_competitors (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                list_id UUID REFERENCES public.competitor_lists(id) ON DELETE CASCADE,
                youtube_id TEXT NOT NULL,
                name TEXT NOT NULL,
                thumbnail_url TEXT,
                subscriber_count INTEGER,
                video_count INTEGER,
                view_count INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(list_id, youtube_id)
            );
            
            -- Enable Row Level Security on both tables
            ALTER TABLE public.competitor_lists ENABLE ROW LEVEL SECURITY;
            ALTER TABLE public.tracked_competitors ENABLE ROW LEVEL SECURITY;
            
            -- Create policies for competitor_lists
            CREATE POLICY "Users can view their own competitor lists" 
            ON public.competitor_lists
            FOR SELECT 
            USING (auth.uid() = user_id);
            
            CREATE POLICY "Users can create their own competitor lists" 
            ON public.competitor_lists
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
            CREATE POLICY "Users can update their own competitor lists" 
            ON public.competitor_lists
            FOR UPDATE 
            USING (auth.uid() = user_id);
            
            CREATE POLICY "Users can delete their own competitor lists" 
            ON public.competitor_lists
            FOR DELETE 
            USING (auth.uid() = user_id);
          `
        });
        
        if (createTableError) {
          setError(`Error creating tables: ${createTableError.message}`);
        } else {
          // Refresh the tests
          window.location.reload();
        }
      }
    } catch (e) {
      setError(`Error fixing tables: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <SupabaseTest />
      
      <DebugComponent />
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Authentication</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p className="mb-2">
              Status: 
              <span className={user ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                {user ? "Authenticated" : "Not authenticated"}
              </span>
            </p>
            {user && (
              <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40 text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {isLoading ? (
          <p>Running tests...</p>
        ) : (
          <div>
            {Object.keys(testResults).map(testName => (
              <div key={testName} className="mb-4 border-b pb-4">
                <h3 className="font-medium">{testName.replace(/_/g, ' ').toUpperCase()}</h3>
                <p className="mb-2">
                  Status: 
                  <span className={testResults[testName].status === 'success' ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                    {testResults[testName].status.toUpperCase()}
                  </span>
                </p>
                <p className="mb-2">Details: {testResults[testName].details}</p>
                {testResults[testName].data && (
                  <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40 text-sm">
                    {JSON.stringify(testResults[testName].data, null, 2)}
                  </pre>
                )}
                {testResults[testName].error && (
                  <div className="mt-2">
                    <p className="text-red-600">Error details:</p>
                    <pre className="bg-red-50 p-3 rounded overflow-auto max-h-40 text-sm">
                      {JSON.stringify(testResults[testName].error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            
            {Object.keys(testResults).length === 0 && !isLoading && (
              <p>No test results available.</p>
            )}
            
            {testResults.competitor_lists_table?.status === 'error' && (
              <button
                onClick={fixMissingTables}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Fixing...' : 'Fix Missing Tables'}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          disabled={isLoading}
        >
          Refresh Tests
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard/competitors'}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Back to Competitors
        </button>
      </div>
    </div>
  );
} 