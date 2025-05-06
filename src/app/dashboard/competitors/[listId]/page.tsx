'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTimes, FaYoutube } from 'react-icons/fa';
import Link from 'next/link';
import { Competitor } from '@/types';
import { competitorsApi } from '@/services/api';
import { getUseRealApi } from '@/services/api/config';

export default function CompetitorListDetail({ params }: { params: { listId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listName = searchParams.get('name') || 'Competitor List';
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompetitorId, setNewCompetitorId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealApi] = useState(getUseRealApi());

  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        // For the demo we just load all competitors in every list
        // In a real app, this would filter based on the list ID
        const data = await competitorsApi.getAllCompetitors();
        setCompetitors(data);
      } catch (error) {
        console.error('Error fetching competitors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, [params.listId]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
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
      setIsModalOpen(false);
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
      <div className="w-full flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-600">Loading competitors...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/competitors" className="text-indigo-600 hover:text-indigo-800 mr-3">
          <FaArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">{listName}</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">{competitors.length} competitors</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus size={14} className="mr-2" />
          Add Competitor
        </button>
      </div>

      {competitors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No competitors added to this list yet.</p>
          <p className="text-gray-700">Add your first competitor to start tracking their channel performance.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Competitor
          </button>
        </div>
      ) : (
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
                    className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    <FaYoutube className="mr-1" /> View Channel
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
      )}

      {/* Add Competitor Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Add New Competitor
            </h3>
            <form onSubmit={handleAddCompetitor}>
              <div className="mb-4">
                <label htmlFor="youtubeId" className="block text-gray-600 text-sm mb-2">
                  YouTube Channel ID
                </label>
                <input 
                  type="text"
                  id="youtubeId"
                  value={newCompetitorId}
                  onChange={(e) => setNewCompetitorId(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-800 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500">
                  Find a channel ID by going to the channel's page and looking at the URL. 
                  It's usually in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg mr-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isAdding || !newCompetitorId.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 