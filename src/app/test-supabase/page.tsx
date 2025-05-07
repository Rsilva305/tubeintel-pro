'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { competitorListsApi } from '@/services/api';
import { getEnvironmentInfo } from '@/lib/env';

export default function TestSupabase() {
  const [lists, setLists] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Test Supabase connection
  useEffect(() => {
    async function testConnection() {
      try {
        setLoading(true);
        // Simple query to test connection
        const { data, error } = await supabase.from('competitor_lists').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseStatus('error');
          setConnectionDetails({ error: error.message, code: error.code });
        } else {
          setSupabaseStatus('connected');
          setConnectionDetails({ count: data });
          
          // Get session info
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            setCurrentUser(sessionData.session.user);
          } else {
            // Try to get user from localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setCurrentUser(JSON.parse(storedUser));
            }
          }
        }
      } catch (err: any) {
        console.error('Error testing Supabase connection:', err);
        setSupabaseStatus('error');
        setConnectionDetails({ error: err.message });
      } finally {
        setLoading(false);
      }
    }
    
    testConnection();
  }, []);

  // Fetch competitor lists
  useEffect(() => {
    async function fetchLists() {
      try {
        setLoading(true);
        const fetchedLists = await competitorListsApi.getUserLists();
        setLists(fetchedLists);
        
        // Select the first list if available
        if (fetchedLists.length > 0) {
          setSelectedListId(fetchedLists[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching lists:', err);
        setError(err.message || 'Failed to fetch competitor lists');
      } finally {
        setLoading(false);
      }
    }

    if (supabaseStatus === 'connected') {
      fetchLists();
    }
  }, [supabaseStatus]);

  // Fetch competitors for selected list
  useEffect(() => {
    async function fetchCompetitors() {
      if (!selectedListId) return;
      
      try {
        setLoading(true);
        const fetchedCompetitors = await competitorListsApi.getCompetitorsInList(selectedListId);
        setCompetitors(fetchedCompetitors);
      } catch (err: any) {
        console.error('Error fetching competitors:', err);
        setError(err.message || 'Failed to fetch competitors');
      } finally {
        setLoading(false);
      }
    }

    if (selectedListId) {
      fetchCompetitors();
    }
  }, [selectedListId]);

  // Handle list selection
  const handleListSelect = (listId: string) => {
    setSelectedListId(listId);
  };

  // Query Supabase directly
  const querySupabaseDirect = async () => {
    try {
      setLoading(true);
      
      // Get lists directly from Supabase
      const { data: listsData, error: listsError } = await supabase
        .from('competitor_lists')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (listsError) throw listsError;
      
      setLists(listsData || []);
      
      // Select first list if available
      if (listsData && listsData.length > 0) {
        const firstListId = listsData[0].id as string;
        setSelectedListId(firstListId);
        
        // Get competitors for this list
        const { data: competitorsData, error: competitorsError } = await supabase
          .from('tracked_competitors')
          .select('*')
          .eq('list_id', firstListId);
          
        if (competitorsError) throw competitorsError;
        
        setCompetitors(competitorsData || []);
      }
    } catch (err: any) {
      console.error('Error querying Supabase directly:', err);
      setError(err.message || 'Failed to query Supabase directly');
    } finally {
      setLoading(false);
    }
  };

  // Create a test list
  const createTestList = async () => {
    try {
      setLoading(true);
      const newList = await competitorListsApi.createList({
        name: `Test List ${new Date().toLocaleTimeString()}`,
        description: "Created for testing purposes",
        userId: 'current'
      });
      
      // Refresh lists
      const fetchedLists = await competitorListsApi.getUserLists();
      setLists(fetchedLists);
      
      // Select the new list
      setSelectedListId(newList.id);
    } catch (err: any) {
      console.error('Error creating test list:', err);
      setError(err.message || 'Failed to create test list');
    } finally {
      setLoading(false);
    }
  };

  // Show environment variables (without exposing secrets)
  const showEnvInfo = () => {
    return getEnvironmentInfo();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Database Test</h1>
      
      {/* Show environment info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Info:</h2>
        <pre>{JSON.stringify(showEnvInfo(), null, 2)}</pre>
      </div>

      {/* Connection Status */}
      <div className={`mb-6 p-4 rounded ${
        supabaseStatus === 'connected' ? 'bg-green-100' : 
        supabaseStatus === 'error' ? 'bg-red-100' : 'bg-gray-100'
      }`}>
        <h2 className="text-lg font-semibold mb-2">Supabase Connection Status:</h2>
        <p className="mb-2">
          Status: <span className={`font-medium ${
            supabaseStatus === 'connected' ? 'text-green-600' : 
            supabaseStatus === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {supabaseStatus === 'connected' ? 'Connected' : 
             supabaseStatus === 'error' ? 'Error' : 'Checking...'}
          </span>
        </p>
        {connectionDetails && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Connection Details:</h3>
            <pre className="text-xs bg-white p-2 rounded">{JSON.stringify(connectionDetails, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Current User Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        {currentUser ? (
          <pre className="text-xs bg-white p-2 rounded">{JSON.stringify(currentUser, null, 2)}</pre>
        ) : (
          <p className="italic text-gray-500">No authenticated user found</p>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          <h2 className="font-semibold">Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {/* Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={querySupabaseDirect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Query Supabase Directly
        </button>
        <button
          onClick={createTestList}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create Test List
        </button>
      </div>
      
      {/* Loading indicator */}
      {loading && <p className="mb-4 italic">Loading...</p>}
      
      {/* Lists display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Competitor Lists</h2>
          {lists.length === 0 ? (
            <p className="italic text-gray-500">No competitor lists found</p>
          ) : (
            <ul className="space-y-2">
              {lists.map(list => (
                <li 
                  key={list.id}
                  className={`p-3 rounded cursor-pointer ${
                    list.id === selectedListId ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-gray-100'
                  }`}
                  onClick={() => handleListSelect(list.id)}
                >
                  <h3 className="font-medium">{list.name}</h3>
                  <p className="text-sm text-gray-600">{list.description}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(list.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    User ID: {list.user_id}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Competitors in Selected List</h2>
          {!selectedListId ? (
            <p className="italic text-gray-500">No list selected</p>
          ) : competitors.length === 0 ? (
            <p className="italic text-gray-500">No competitors in this list</p>
          ) : (
            <ul className="space-y-2">
              {competitors.map(competitor => (
                <li key={competitor.id} className="p-3 bg-gray-100 rounded">
                  <div className="flex items-center gap-3">
                    {competitor.thumbnailUrl && (
                      <img 
                        src={competitor.thumbnailUrl} 
                        alt={competitor.name} 
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{competitor.name}</h3>
                      <p className="text-xs text-gray-500">ID: {competitor.youtubeId}</p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Subscribers:</span>{' '}
                      {competitor.subscriberCount?.toLocaleString() || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">Videos:</span>{' '}
                      {competitor.videoCount?.toLocaleString() || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">Views:</span>{' '}
                      {competitor.viewCount?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Raw data for debugging */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Raw Supabase Data:</h2>
        <div className="overflow-auto max-h-96">
          <h3 className="font-medium mb-1">Lists:</h3>
          <pre className="bg-white p-2 rounded mb-4 text-xs">
            {JSON.stringify(lists, null, 2)}
          </pre>
          
          <h3 className="font-medium mb-1">Competitors:</h3>
          <pre className="bg-white p-2 rounded text-xs">
            {JSON.stringify(competitors, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 