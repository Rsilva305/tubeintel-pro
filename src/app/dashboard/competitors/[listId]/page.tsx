'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTimes, FaYoutube, FaEllipsisV, FaChartBar, FaDownload, FaFilter, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import { Competitor } from '@/types';
import { competitorsApi } from '@/services/api';
import { getUseRealApi } from '@/services/api/config';

// Mock suggested competitors for demo
const suggestedCompetitors = [
  { id: 'sugg1', name: 'TechReviewer', thumbnailUrl: 'https://via.placeholder.com/150?text=TR', subscriberCount: 208000, videoCount: 342, viewCount: 15600000 },
  { id: 'sugg2', name: 'GamingDaily', thumbnailUrl: 'https://via.placeholder.com/150?text=GD', subscriberCount: 620000, videoCount: 527, viewCount: 48000000 },
  { id: 'sugg3', name: 'FoodChannel', thumbnailUrl: 'https://via.placeholder.com/150?text=FC', subscriberCount: 779000, videoCount: 623, viewCount: 53000000 },
  { id: 'sugg4', name: 'TravelVlog', thumbnailUrl: 'https://via.placeholder.com/150?text=TV', subscriberCount: 318000, videoCount: 287, viewCount: 22000000 },
];

// Format number to compact form
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

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
  const [chartMetric, setChartMetric] = useState('Subscribers');
  const [subscribersOnly, setSubscribersOnly] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading competitors...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link href="/dashboard/competitors" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">
          <FaArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">{listName}</h1>
      </div>

      {/* Performance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Performance</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={subscribersOnly} 
                    onChange={() => setSubscribersOnly(!subscribersOnly)} 
                  />
                  <div className={`block w-10 h-6 rounded-full ${subscribersOnly ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${subscribersOnly ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="ml-2 text-gray-700 dark:text-gray-300 text-sm">Subscribers</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-indigo-600 dark:text-indigo-400 bg-transparent p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaChartBar size={20} />
              </button>
              <button className="text-gray-400 dark:text-gray-500 bg-transparent p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <FaDownload size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart dropdown */}
        <div className="mb-4">
          <div className="relative inline-block">
            <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm">
              <span>{chartMetric}</span>
              <FaChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="h-[200px] w-full relative">
          <div className="absolute left-0 top-0 h-full w-16 flex flex-col justify-between text-right pr-2 text-xs text-gray-500">
            <span>{formatNumber(Math.max(...competitors.map(c => c.subscriberCount)))}</span>
            <span>{formatNumber(Math.max(...competitors.map(c => c.subscriberCount)) / 2)}</span>
            <span>{formatNumber(Math.max(...competitors.map(c => c.subscriberCount)) / 4)}</span>
            <span>0</span>
          </div>
          <div className="ml-16 h-full flex items-end gap-4">
            {competitors.slice(0, 6).map((competitor, index) => (
              <div key={competitor.id} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t-sm" 
                  style={{ 
                    height: `${Math.max((competitor.subscriberCount / Math.max(...competitors.map(c => c.subscriberCount))) * 180, 10)}px`,
                    backgroundColor: '#4f46e5',
                    opacity: index === 0 ? 1 : (index === 1 ? 0.9 : (index === 2 ? 0.8 : (index === 3 ? 0.7 : (index === 4 ? 0.6 : 0.5))))
                  }}
                ></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 mt-2 overflow-hidden flex items-center justify-center">
                  <img 
                    src={competitor.thumbnailUrl} 
                    alt={competitor.name}
                    className="w-8 h-8 object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested competitors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Suggested competitors</h2>
            <div className="text-gray-400 dark:text-gray-500 cursor-help" title="Channels similar to your current competitors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Competitor Carousel */}
        <div className="relative mb-4 overflow-hidden">
          <div className="flex gap-4 pb-4 overflow-x-auto">
            {suggestedCompetitors.map((competitor) => (
              <div key={competitor.id} className="flex-shrink-0 w-[220px] bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-gray-200 dark:bg-gray-600">
                    <img 
                      src={competitor.thumbnailUrl}
                      alt={competitor.name}
                      className="w-16 h-16 object-cover"
                    />
                  </div>
                  <h3 className="text-gray-800 dark:text-white font-medium text-base mb-1">{competitor.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{formatNumber(competitor.subscriberCount)} subscribers</p>
                  <button 
                    className="w-full flex items-center justify-center gap-1 bg-transparent border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-md text-sm transition-colors"
                    onClick={() => {
                      // In a real implementation, we would add this competitor
                      alert(`Would add ${competitor.name} to your tracked competitors`);
                    }}
                  >
                    <FaPlus size={14} />
                    <span>Track competitor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg text-gray-700 dark:text-gray-300 mr-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <FaFilter size={18} />
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search competitors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm">
              <span>Sort by: {sortBy}</span>
              <FaChevronDown size={14} />
            </button>
          </div>
          
          <div className="flex items-center">
            <button 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus size={14} />
              <span>Add competitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white">Filter competitors</h3>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Competitor type</label>
              <select 
                className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All competitors</option>
                <option value="tracked">Currently tracked</option>
                <option value="suggested">Suggested only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Content focus</label>
              <select 
                className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="any">Any content</option>
                <option value="tech">Technology</option>
                <option value="gaming">Gaming</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">Sort by</label>
              <select 
                className="w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date added (newest)</option>
                <option value="subscribers">Subscribers (high to low)</option>
                <option value="views">Views (high to low)</option>
                <option value="videos">Videos (high to low)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Reset
            </button>
            <button className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Competitors Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        {competitors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No competitors added to this list yet.</p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Add your first competitor to start tracking their channel performance.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Competitor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors
              .filter(comp => comp.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => {
                switch (sortBy) {
                  case 'subscribers': return b.subscriberCount - a.subscriberCount;
                  case 'views': return b.viewCount - a.viewCount;
                  case 'videos': return b.videoCount - a.videoCount;
                  case 'name': return a.name.localeCompare(b.name);
                  default: return 0; // date added would use timestamps in a real app
                }
              })
              .map(competitor => (
                <div key={competitor.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={competitor.thumbnailUrl} 
                        alt={competitor.name} 
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <h3 className="font-semibold text-lg dark:text-white">{competitor.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{competitor.youtubeId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Subscribers</p>
                        <p className="font-semibold dark:text-white">{competitor.subscriberCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Videos</p>
                        <p className="font-semibold dark:text-white">{competitor.videoCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md col-span-2">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total Views</p>
                        <p className="font-semibold dark:text-white">{competitor.viewCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <a 
                        href={`https://youtube.com/channel/${competitor.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        <FaYoutube className="mr-1" /> View Channel
                      </a>
                      <button 
                        onClick={() => handleRemoveCompetitor(competitor.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Competitor Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Add New Competitor
            </h3>
            <form onSubmit={handleAddCompetitor}>
              <div className="mb-4">
                <label htmlFor="youtubeId" className="block text-gray-600 dark:text-gray-300 text-sm mb-2">
                  YouTube Channel ID
                </label>
                <input 
                  type="text"
                  id="youtubeId"
                  value={newCompetitorId}
                  onChange={(e) => setNewCompetitorId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Find a channel ID by going to the channel's page and looking at the URL. 
                  It's usually in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
                </p>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-lg mr-2"
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