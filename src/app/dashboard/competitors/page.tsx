'use client';

import { useState, useEffect } from 'react';
import { Competitor } from '@/types';
import { competitorsApi } from '@/services/api';
import { getUseRealApi } from '@/services/api/config';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompetitorId, setNewCompetitorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [useRealApi, setUseRealApi] = useState(getUseRealApi());

  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        const data = await competitorsApi.getAllCompetitors();
        setCompetitors(data);
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, []);

  // Listen for API mode changes
  useEffect(() => {
    const handleApiChange = () => {
      setUseRealApi(getUseRealApi());
    };

    // Check for API mode changes every second
    const interval = setInterval(handleApiChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCompetitorId) {
      setError('Please enter a YouTube channel ID');
      return;
    }

    setError(null);
    setIsAdding(true);
    
    try {
      // When using real API, we only need the YouTube ID
      // The API will fetch all other details
      const competitorData = {
        youtubeId: newCompetitorId,
        name: useRealApi ? '' : `Competitor ${competitors.length + 1}`, // API will override this for real API
        thumbnailUrl: 'https://via.placeholder.com/150', // API will override this for real API
        subscriberCount: 0, // API will override this for real API
        videoCount: 0, // API will override this for real API
        viewCount: 0 // API will override this for real API
      };
      
      const competitor = await competitorsApi.addCompetitor(competitorData);
      setCompetitors(prev => [...prev, competitor]);
      setNewCompetitorId('');
      setShowForm(false);
    } catch (error) {
      console.error('Error adding competitor:', error);
      setError('Could not add this channel. Please check the ID and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCompetitor = async (id: string) => {
    try {
      await competitorsApi.removeCompetitor(id);
      setCompetitors(prev => prev.filter(competitor => competitor.id !== id));
    } catch (error) {
      console.error('Error removing competitor:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-500">Loading competitors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Competitor Channel Tracker</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          {showForm ? 'Cancel' : 'Add Competitor'}
        </button>
      </div>

      {/* Info box for the user */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          Track your competitor channels to understand how your content stacks up.
          {useRealApi 
            ? ' Add channels using their YouTube IDs to get real data.' 
            : ' You are in mock data mode. Enable real YouTube API in Settings to track real channels.'}
        </p>
      </div>

      {/* Add Competitor Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Competitor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="youtubeId" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Channel ID
              </label>
              <input
                type="text"
                id="youtubeId"
                value={newCompetitorId}
                onChange={(e) => setNewCompetitorId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
              />
              <p className="mt-1 text-sm text-gray-500">
                Find a channel ID by going to the channel's page and looking at the URL. 
                It's usually in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isAdding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Add Competitor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Competitors Grid */}
      {competitors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map(competitor => (
            <div key={competitor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={competitor.thumbnailUrl} 
                    alt={competitor.name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{competitor.name}</h3>
                    <p className="text-gray-500 text-sm truncate">{competitor.youtubeId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-xs">Subscribers</p>
                    <p className="font-semibold">{competitor.subscriberCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-gray-500 text-xs">Videos</p>
                    <p className="font-semibold">{competitor.videoCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md col-span-2">
                    <p className="text-gray-500 text-xs">Total Views</p>
                    <p className="font-semibold">{competitor.viewCount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <a 
                    href={`https://youtube.com/channel/${competitor.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Channel
                  </a>
                  <button 
                    onClick={() => handleRemoveCompetitor(competitor.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No competitors added yet.</p>
          <p className="text-gray-700">Add your first competitor to start tracking their channel performance.</p>
        </div>
      )}
    </div>
  );
} 