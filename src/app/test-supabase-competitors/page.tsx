'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { competitorListsApi } from '@/services/api/competitorLists';
import { getUseRealApi, setUseRealApi, useRealApiForCompetitors } from '@/services/api/config';
import Link from 'next/link';

export default function TestSupabaseCompetitorsPage() {
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listName, setListName] = useState<string>('Test List ' + new Date().toISOString().slice(0, 16));
  const [apiMode, setApiMode] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setApiMode(getUseRealApi());
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };
    
    checkAuth();
  }, []);
  
  // Toggle API mode
  const toggleApiMode = () => {
    const newMode = !apiMode;
    setUseRealApi(newMode);
    setApiMode(newMode);
    addTestResult('API Mode', `Changed to ${newMode ? 'REAL' : 'DEMO'}`);
  };
  
  // Test creating a list
  const testCreateList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessage('');
      
      addTestResult('createList', 'Starting test...');
      
      if (!user) {
        setError('Not authenticated. Please log in first.');
        addTestResult('createList', 'ERROR: Not authenticated');
        return;
      }
      
      // Log real API mode
      const realApi = getUseRealApi();
      const competitorsApi = useRealApiForCompetitors();
      addTestResult('API Mode Check', `Using real API: ${realApi}`);
      addTestResult('Competitors API Check', `Using real API for competitors: ${competitorsApi}`);
      
      // First, directly try the Supabase query
      addTestResult('Direct Supabase Test', 'Testing direct insert...');
      
      try {
        const { data: directData, error: directError } = await supabase
          .from('competitor_lists')
          .insert([{
            name: `${listName} (Direct)`,
            description: 'Test list created directly with Supabase',
            user_id: user.id
          }])
          .select()
          .single();
          
        if (directError) {
          addTestResult('Direct Supabase Test', `ERROR: ${directError.message}`);
        } else {
          addTestResult('Direct Supabase Test', `SUCCESS: Created list with ID ${directData.id}`);
        }
      } catch (directErr) {
        addTestResult('Direct Supabase Test', `EXCEPTION: ${directErr instanceof Error ? directErr.message : String(directErr)}`);
      }
      
      // Now try using the API
      addTestResult('API Test', 'Testing via competitorListsApi...');
      
      try {
        const result = await competitorListsApi.createList({
          name: listName,
          description: 'Test list created via API',
          userId: 'current'
        });
        
        addTestResult('API Test', `SUCCESS: Created list with ID ${result.id}`);
        setMessage(`List created successfully with ID: ${result.id}`);
        
        // Now check if we can retrieve it
        const lists = await competitorListsApi.getUserLists();
        const createdList = lists.find(l => l.id === result.id);
        
        if (createdList) {
          addTestResult('Verification', `SUCCESS: List found in getUserLists`);
        } else {
          addTestResult('Verification', `WARNING: List not found in getUserLists`);
        }
      } catch (apiErr) {
        setError(`API error: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`);
        addTestResult('API Test', `ERROR: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`);
      }
    } catch (err) {
      setError(`Test error: ${err instanceof Error ? err.message : String(err)}`);
      addTestResult('Overall Test', `ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to add a test result entry
  const addTestResult = (step: string, result: string) => {
    setTestResults(prev => [
      { 
        id: Date.now(), 
        step, 
        result, 
        timestamp: new Date().toISOString() 
      },
      ...prev
    ]);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Supabase Competitor Lists Test</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-medium mb-2">User Status</h2>
        {user ? (
          <div>
            <p className="text-green-600 mb-2">✓ Authenticated as: {user.email}</p>
            <div className="text-xs bg-white p-2 rounded overflow-auto">
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <p className="text-red-600">Not authenticated</p>
        )}
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-medium mb-2">API Mode</h2>
        <div className="flex items-center gap-3">
          <span className={apiMode ? "text-gray-400" : "font-medium"}>Demo</span>
          <button 
            onClick={toggleApiMode}
            className={`relative w-12 h-6 rounded-full transition ${
              apiMode ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
              apiMode ? "translate-x-6" : ""
            }`}></span>
          </button>
          <span className={apiMode ? "font-medium" : "text-gray-400"}>Real</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Current mode: {apiMode ? "REAL API (saves to Supabase)" : "DEMO (doesn't save to Supabase)"}
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-medium mb-2">Test Creating Competitor List</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
        <button
          onClick={testCreateList}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          {isLoading ? 'Testing...' : 'Test Create List'}
        </button>
        
        {message && (
          <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-md">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Test Results</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testResults.map((result) => (
                <tr key={result.id}>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {result.step}
                  </td>
                  <td className={`px-4 py-2 text-sm ${
                    result.result.includes('ERROR') 
                      ? 'text-red-600' 
                      : result.result.includes('SUCCESS')
                        ? 'text-green-600'
                        : 'text-gray-800'
                  }`}>
                    {result.result}
                  </td>
                </tr>
              ))}
              {testResults.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                    No test results yet. Run a test to see results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Back to Dashboard
        </Link>
        <Link href="/test-db" className="text-blue-500 hover:underline">
          Go to Database Test Page
        </Link>
      </div>
    </div>
  );
} 