'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTimes, FaYoutube, FaEllipsisV, FaChartBar, FaDownload, FaFilter, FaChevronDown, FaCalendarAlt } from 'react-icons/fa';
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
  
  // Modified filter states (changed from range arrays to single values)
  const [viewsThreshold, setViewsThreshold] = useState<number>(10000000); // Default to 10M
  const [subscribersThreshold, setSubscribersThreshold] = useState<number>(100000); // Default to 100K
  const [videoDurationThreshold, setVideoDurationThreshold] = useState<number>(60); // Default to 60 minutes (1 hour)
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    new Date().toISOString().split('T')[0] // today
  ]);

  // Add new state for view multiplier
  const [viewMultiplierThreshold, setViewMultiplierThreshold] = useState<number>(1.5); // Default to 1.5x

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

  // Function to handle filter apply
  const applyFilter = () => {
    // In a real app, this would filter based on the selected criteria
    // Here's how we might filter the competitors based on the thresholds:
    const filteredCompetitors = competitors.filter(competitor => {
      const meetsViewsThreshold = competitor.viewCount >= viewsThreshold;
      const meetsSubscribersThreshold = competitor.subscriberCount >= subscribersThreshold;
      
      // For view multiplier we'd need data on median views per channel
      // const hasHighMultiplier = competitor.viewMultiplier >= viewMultiplierThreshold;
      
      // For video duration we would need actual data about average video length
      
      // Check if within date range - would need actual data on when added
      // const addedDate = new Date(competitor.addedAt);
      // const isWithinDateRange = addedDate >= new Date(dateRange[0]) && addedDate <= new Date(dateRange[1]);
      
      return meetsViewsThreshold && meetsSubscribersThreshold; // && hasHighMultiplier;
    });
    
    console.log(`Filter applied: Competitors matching criteria: ${filteredCompetitors.length}`);
    // For demo purposes, we're not actually changing the displayed list
    setIsFilterOpen(false);
  }

  // Function to reset filters (updated for single values)
  const resetFilter = () => {
    setViewsThreshold(10000000);
    setSubscribersThreshold(100000);
    setVideoDurationThreshold(60);
    setViewMultiplierThreshold(1.5);
    setDateRange([
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]);
  }

  // Helper function to safely parse input values
  const safeParseInt = (value: string, fallback = 0): number => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Handler for views input
  const handleViewsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = safeParseInt(e.target.value, 0);
    setViewsThreshold(Math.min(value, 500000000)); // Cap at 500M
  };

  // Handler for subscribers input
  const handleSubscribersInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = safeParseInt(e.target.value, 0);
    setSubscribersThreshold(Math.min(value, 500000000)); // Cap at 500M
  };

  // Handler for hours input
  const handleHoursInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = safeParseInt(e.target.value, 0);
    const minutes = videoDurationThreshold % 60;
    setVideoDurationThreshold(Math.min(hours, 24) * 60 + minutes); // Cap at 24h
  };

  // Handler for minutes input
  const handleMinutesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = Math.floor(videoDurationThreshold / 60);
    const minutes = safeParseInt(e.target.value, 0);
    setVideoDurationThreshold(hours * 60 + Math.min(minutes, 59)); // Cap at 59m
  };

  // Handler for view multiplier input
  const handleViewMultiplierInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setViewMultiplierThreshold(Math.max(0, Math.min(value, 500))); // Increased cap to 500x
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

      {/* New Filter Popup */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl p-6 relative">
            <button 
              onClick={() => setIsFilterOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Filter Competitors
            </h3>
            
            <div className="grid grid-cols-3 gap-8">
              {/* Left column with sliders */}
              <div className="col-span-2 space-y-8">
                {/* Views slider - modified to single handle */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Minimum Views: {formatNumber(viewsThreshold)}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>500M</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="500000000" 
                      step="1000000"
                      value={viewsThreshold}
                      onChange={handleViewsInput}
                      className="slider-track mb-2"
                    />
                    {/* Added input field for direct value entry */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom value:</label>
                      <input
                        type="number"
                        min="0"
                        max="500000000"
                        value={viewsThreshold}
                        onChange={handleViewsInput}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Subscribers slider - modified to single handle */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Minimum Subscribers: {formatNumber(subscribersThreshold)}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>500M</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="500000000" 
                      step="100000"
                      value={subscribersThreshold}
                      onChange={handleSubscribersInput}
                      className="slider-track mb-2"
                    />
                    {/* Added input field for direct value entry */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom value:</label>
                      <input
                        type="number"
                        min="0"
                        max="500000000"
                        value={subscribersThreshold}
                        onChange={handleSubscribersInput}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Video Duration slider - modified to single handle and 24 hour range */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Maximum Video Duration: {Math.floor(videoDurationThreshold / 60)}h {videoDurationThreshold % 60}m
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>24h</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1440" 
                      step="10"
                      value={videoDurationThreshold}
                      onChange={handleHoursInput}
                      className="slider-track mb-2"
                    />
                    {/* Added input field for direct value entry with hours and minutes */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom value:</label>
                      <div className="flex">
                        <div className="flex items-center mr-2">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            value={Math.floor(videoDurationThreshold / 60)}
                            onChange={handleHoursInput}
                            className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                          />
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">h</span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={videoDurationThreshold % 60}
                            onChange={handleMinutesInput}
                            className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                          />
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add View Multiplier slider after Video Duration slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium flex items-center">
                    View Multiplier: {viewMultiplierThreshold < 10 ? viewMultiplierThreshold.toFixed(1) : viewMultiplierThreshold.toFixed(0)}x
                    <div className="ml-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-help group relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-full ml-2 w-60 p-2 bg-white dark:bg-gray-700 shadow-lg rounded text-xs border border-gray-200 dark:border-gray-600 hidden group-hover:block z-10">
                        View Multiplier is the ratio of video views to the channel's median views. A value of 2 means videos with twice the channel's normal performance.
                      </div>
                    </div>
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0x</span>
                      <span className="text-center ml-12">10x</span>
                      <span className="text-center ml-12">50x</span>
                      <span className="text-center ml-12">100x</span>
                      <span>500x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="500" 
                      step={viewMultiplierThreshold < 10 ? "0.1" : (viewMultiplierThreshold < 50 ? "1" : "5")}
                      value={viewMultiplierThreshold}
                      onChange={(e) => setViewMultiplierThreshold(parseFloat(e.target.value))}
                      className="slider-track mb-2"
                    />
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1 mb-2">
                      Current: {viewMultiplierThreshold < 10 ? viewMultiplierThreshold.toFixed(1) : viewMultiplierThreshold.toFixed(0)}x median views
                    </div>
                    
                    {/* Input field for direct value entry */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom value:</label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          step="0.5"
                          value={viewMultiplierThreshold}
                          onChange={handleViewMultiplierInput}
                          className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                        />
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">x median</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column with calendar */}
              <div className="col-span-1">
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-4 font-medium flex items-center">
                    <FaCalendarAlt className="mr-2" /> Time Range
                  </label>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Start Date
                      </label>
                      <input 
                        type="date" 
                        value={dateRange[0]}
                        onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        End Date
                      </label>
                      <input 
                        type="date" 
                        value={dateRange[1]}
                        onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                        className="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-auto">Quick select:</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button 
                          onClick={() => setDateRange([
                            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          Last 7 days
                        </button>
                        <button 
                          onClick={() => setDateRange([
                            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          Last 30 days
                        </button>
                        <button 
                          onClick={() => setDateRange([
                            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          Last 90 days
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={resetFilter}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={applyFilter}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
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