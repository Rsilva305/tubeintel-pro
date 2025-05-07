'use client';

import { useState, useEffect } from 'react';
import { getUseRealApi, setUseRealApi } from '@/services/api/config';
import { competitorsApi } from '@/services/api';
import { Competitor } from '@/types';
import Link from 'next/link';

export default function TestPage() {
  const [useRealApi, setUseRealApiState] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCompetitor, setNewCompetitor] = useState({
    youtubeId: '',
    name: '',
  });
  
  // Initialize state on client-side
  useEffect(() => {
    setUseRealApiState(getUseRealApi());
  }, []);
  
  // Toggle API mode
  const toggleApiMode = () => {
    const newValue = !useRealApi;
    setUseRealApi(newValue);
    setUseRealApiState(newValue);
    fetchCompetitors(); // Refresh data when toggling
  };
  
  // Fetch competitors
  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await competitorsApi.getAllCompetitors();
      setCompetitors(data);
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError('Failed to load competitors. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add a competitor
  const addCompetitor = async () => {
    if (!newCompetitor.youtubeId) {
      setError('YouTube channel ID is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const competitor = await competitorsApi.addCompetitor({
        youtubeId: newCompetitor.youtubeId,
        name: newCompetitor.name || newCompetitor.youtubeId,
        thumbnailUrl: '',
        subscriberCount: 0,
        videoCount: 0,
        viewCount: 0
      });
      
      setCompetitors([...competitors, competitor]);
      setNewCompetitor({ youtubeId: '', name: '' });
    } catch (err) {
      console.error('Error adding competitor:', err);
      setError('Failed to add competitor. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a competitor
  const deleteCompetitor = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await competitorsApi.removeCompetitor(id);
      setCompetitors(competitors.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error removing competitor:', err);
      setError('Failed to remove competitor. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load competitors on initial render
  useEffect(() => {
    fetchCompetitors();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Integration Test</h1>
      
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">API Mode: {useRealApi ? 'REAL' : 'DEMO'}</p>
            <p className="text-sm text-gray-700">
              {useRealApi 
                ? 'Using real Supabase database. Changes will be saved.' 
                : 'Using demo mode. Changes will NOT be saved to database.'}
            </p>
          </div>
          <button 
            onClick={toggleApiMode}
            className={`px-4 py-2 rounded font-bold ${
              useRealApi 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {useRealApi ? 'Using Real API' : 'Using Demo Mode'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add a Competitor</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="YouTube Channel ID"
            value={newCompetitor.youtubeId}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, youtubeId: e.target.value })}
            className="border p-2 rounded flex-grow"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={newCompetitor.name}
            onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
            className="border p-2 rounded flex-grow"
          />
          <button
            onClick={addCompetitor}
            disabled={loading || !newCompetitor.youtubeId}
            className={`px-4 py-2 rounded ${
              loading || !newCompetitor.youtubeId
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Tip:</strong> Always provide both Channel ID and Name for the most reliable operation.
        </p>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Competitors</h2>
        
        {loading && competitors.length === 0 ? (
          <div className="text-center p-4">Loading...</div>
        ) : competitors.length === 0 ? (
          <div className="text-center p-4 border border-dashed rounded">
            <p className="text-gray-500">No competitors added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map(competitor => (
              <div key={competitor.id} className="border rounded p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {competitor.thumbnailUrl ? (
                    <img
                      src={competitor.thumbnailUrl}
                      alt={competitor.name}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                      <span className="text-gray-500">?</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{competitor.name}</h3>
                    <p className="text-xs text-gray-500">{competitor.youtubeId}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Subscribers</p>
                    <p className="font-medium">{competitor.subscriberCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Videos</p>
                    <p className="font-medium">{competitor.videoCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Views</p>
                    <p className="font-medium">{competitor.viewCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <a
                    href={`https://youtube.com/channel/${competitor.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Channel
                  </a>
                  <button
                    onClick={() => deleteCompetitor(competitor.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t pt-4">
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
} 