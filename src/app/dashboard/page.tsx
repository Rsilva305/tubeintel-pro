'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/types';
import { videosApi } from '@/services/api';
import { FaTable, FaThLarge, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getChannelTrendData } from '@/services/metrics/history';
import { calculateOutlierScore, getTopPerformingVideos } from '@/services/metrics/outliers';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type SortOption = 'date' | 'vph';
type ViewMode = 'list' | 'grid';
type TimeFrame = '24h' | '7d' | '30d';

interface TrendData {
  current: number;
  previous: number;
  percentage: number;
  hasPreviousData?: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [topVideos, setTopVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('24h');

  // Calculate trends with historical data if available
  const [viewsTrend, setViewsTrend] = useState<TrendData>({ current: 0, previous: 0, percentage: 0 });
  const [likesTrend, setLikesTrend] = useState<TrendData>({ current: 0, previous: 0, percentage: 0 });
  const [vphTrend, setVphTrend] = useState<TrendData>({ current: 0, previous: 0, percentage: 0 });

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  // Function to get date range based on selected time frame
  const getDateRange = (timeFrame: TimeFrame) => {
    const now = new Date();
    const start = new Date();
    
    switch (timeFrame) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return { start, end: now };
  };

  // Function to filter videos by date range
  const filterVideosByDateRange = (videos: Video[], timeFrame: TimeFrame) => {
    const { start } = getDateRange(timeFrame);
    return videos.filter(video => new Date(video.publishedAt) >= start);
  };

  // Function to fetch data
  const fetchData = async () => {
    try {
      const recentVideosData = await videosApi.getRecentVideos(100); // Increased to get more historical data for 30d trends
      
      console.log("Fetched videos count:", recentVideosData.length);
      // Log date ranges of videos to help with debugging
      if (recentVideosData.length > 0) {
        const dates = recentVideosData.map(v => new Date(v.publishedAt).getTime());
        const oldest = new Date(Math.min(...dates));
        const newest = new Date(Math.max(...dates));
        console.log("Video date range:", {
          oldest: oldest.toISOString().split('T')[0],
          newest: newest.toISOString().split('T')[0],
          daysSpan: Math.round((newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
      
      // Get top performing videos using the new comprehensive ranking algorithm
      const topVids = getTopPerformingVideos(recentVideosData, 4);
      console.log("Top videos with performance scores:", topVids.map(v => ({
        title: v.title.substring(0, 20),
        performanceScore: v.performanceScore,
        vph: v.vph,
        views: v.viewCount
      })));
      
      setTopVideos(topVids);
      setRecentVideos(recentVideosData);
      setLastUpdated(new Date());
      setShowUpdateNotification(true);
      
      setTimeout(() => {
        setShowUpdateNotification(false);
      }, 5000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Set up background updates every 4 hours
  useEffect(() => {
    const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    const intervalId = setInterval(fetchData, fourHours);

    return () => clearInterval(intervalId);
  }, []);

  // Sort videos based on selected option
  const sortedRecentVideos = [...recentVideos].sort((a, b) => {
    if (sortOption === 'date') {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else {
      return b.vph - a.vph;
    }
  });

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Calculate channel statistics based on selected time frame
  const filteredVideos = filterVideosByDateRange(recentVideos, selectedTimeFrame);
  const totalViews = filteredVideos.reduce((sum, video) => sum + video.viewCount, 0);
  const totalLikes = filteredVideos.reduce((sum, video) => sum + video.likeCount, 0);
  const averageVph = Math.round(filteredVideos.reduce((sum, video) => sum + video.vph, 0) / Math.max(1, filteredVideos.length));

  // Function to calculate trend data
  const calculateTrend = (current: number, previous: number): TrendData => {
    // If both are 0, trend is 0
    if (current === 0 && previous === 0) return { current, previous, percentage: 0 };
    
    // If only previous is 0 but current has value, show as 100% increase
    if (previous === 0 && current > 0) return { current, previous, percentage: 100 };
    
    // Normal calculation
    const percentage = ((current - previous) / previous) * 100;
    return {
      current,
      previous,
      percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal place
    };
  };

  // Function to get previous period data
  const getPreviousPeriodData = (timeFrame: TimeFrame) => {
    const { start } = getDateRange(timeFrame);
    
    // For each timeframe, calculate the equivalent previous period
    let previousStart: Date, previousEnd: Date;
    
    switch (timeFrame) {
      case '24h':
        // Previous period is the 24 hours before current period
        previousStart = new Date(start);
        previousStart.setHours(previousStart.getHours() - 24);
        previousEnd = new Date(start);
        break;
      case '7d':
        // Previous period is the 7 days before current period
        previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 7);
        previousEnd = new Date(start);
        break;
      case '30d':
        // Previous period is the 30 days before current period
        previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 30);
        previousEnd = new Date(start);
        break;
    }
    
    return { start: previousStart, end: previousEnd };
  };

  // Get videos from previous period
  const { start: prevStart, end: prevEnd } = getPreviousPeriodData(selectedTimeFrame);
  const previousPeriodVideos = recentVideos.filter(video => {
    const videoDate = new Date(video.publishedAt);
    return videoDate >= prevStart && videoDate <= prevEnd;
  });

  // Calculate metrics for previous period
  const previousTotalViews = previousPeriodVideos.reduce((sum, video) => sum + video.viewCount, 0);
  const previousTotalLikes = previousPeriodVideos.reduce((sum, video) => sum + video.likeCount, 0);
  const previousAverageVph = Math.round(previousPeriodVideos.reduce((sum, video) => sum + video.vph, 0) / Math.max(1, previousPeriodVideos.length));

  // Get trend data from historical metrics
  useEffect(() => {
    async function fetchHistoricalTrends() {
      if (recentVideos.length > 0) {
        const channelId = recentVideos[0].channelId;
        
        try {
          // Get days for the selected timeframe
          let daysBack = 1;
          switch (selectedTimeFrame) {
            case '24h': daysBack = 1; break;
            case '7d': daysBack = 7; break;
            case '30d': daysBack = 30; break;
          }
          
          // Get metrics trends from stored history data
          const [viewsTrendData, subscriberTrendData] = await Promise.all([
            getChannelTrendData(channelId, 'total_views', totalViews, daysBack),
            getChannelTrendData(channelId, 'subscriber_count', 0, daysBack), // We don't have subscriber count in our UI stats yet
          ]);
          
          // Calculate VPH trend using our regular calculation as backup
          const regularVphTrend = calculateTrend(averageVph, previousAverageVph);
          
          // Update trend states with the historical data
          setViewsTrend(viewsTrendData.hasPreviousData ? viewsTrendData : calculateTrend(totalViews, previousTotalViews));
          setLikesTrend(calculateTrend(totalLikes, previousTotalLikes)); // We don't store total_likes in channel history yet
          setVphTrend(regularVphTrend); // Using regular calculation for VPH for now
          
        } catch (error) {
          console.error('Error fetching historical trend data:', error);
          // Fallback to regular calculations if historical data fails
          setViewsTrend(calculateTrend(totalViews, previousTotalViews));
          setLikesTrend(calculateTrend(totalLikes, previousTotalLikes));
          setVphTrend(calculateTrend(averageVph, previousAverageVph));
        }
      } else {
        // No videos, set default trends
        setViewsTrend(calculateTrend(totalViews, previousTotalViews));
        setLikesTrend(calculateTrend(totalLikes, previousTotalLikes));
        setViewsTrend({ current: 0, previous: 0, percentage: 0 });
        setLikesTrend({ current: 0, previous: 0, percentage: 0 });
        setVphTrend({ current: 0, previous: 0, percentage: 0 });
      }
    }
    
    fetchHistoricalTrends();
  }, [recentVideos, selectedTimeFrame, totalViews, totalLikes, averageVph, previousTotalViews, previousTotalLikes, previousAverageVph]);

  // Prepare data for mini-graphs
  const prepareGraphData = (videos: Video[], metric: 'viewCount' | 'likeCount' | 'vph') => {
    const sortedVideos = [...videos].sort((a, b) => 
      new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );
    
    return {
      labels: sortedVideos.map(v => new Date(v.publishedAt).toLocaleDateString()),
      datasets: [{
        label: metric === 'viewCount' ? 'Views' : metric === 'likeCount' ? 'Likes' : 'VPH',
        data: sortedVideos.map(v => v[metric]),
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.4,
        pointRadius: 0,
      }]
    };
  };

  const graphOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    elements: {
      line: {
        borderWidth: 2
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl dark:text-white">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold dark:text-white">Welcome to TubeIntel Pro{user ? `, ${user.username}` : ''}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Here's an overview of your channel performance</p>
          
          {/* Welcome Card */}
          <div className="mt-6 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Channel Summary</h2>
                <p className="opacity-80 mt-1">Last updated: {lastUpdated.toLocaleString()}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-xl p-1">
                  <button
                    onClick={() => setSelectedTimeFrame('24h')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeFrame === '24h' 
                        ? 'bg-white bg-opacity-30 text-white' 
                        : 'text-white text-opacity-70 hover:text-opacity-100'
                    }`}
                  >
                    24h
                  </button>
                  <button
                    onClick={() => setSelectedTimeFrame('7d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeFrame === '7d' 
                        ? 'bg-white bg-opacity-30 text-white' 
                        : 'text-white text-opacity-70 hover:text-opacity-100'
                    }`}
                  >
                    7d
                  </button>
                  <button
                    onClick={() => setSelectedTimeFrame('30d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeFrame === '30d' 
                        ? 'bg-white bg-opacity-30 text-white' 
                        : 'text-white text-opacity-70 hover:text-opacity-100'
                    }`}
                  >
                    30d
                  </button>
                </div>
              </div>
            </div>
            
            {/* Update Notification */}
            {showUpdateNotification && (
              <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-2 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Data refreshed successfully
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-70">Total Views</p>
                    <p className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      {viewsTrend.percentage > 0 ? (
                        <FaArrowUp className="text-green-400 mr-1" />
                      ) : (
                        <FaArrowDown className="text-red-400 mr-1" />
                      )}
                      <span className={`text-sm ${viewsTrend.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(viewsTrend.percentage)}%
                      </span>
                    </div>
                  </div>
                  <FaChartLine className="text-white text-opacity-50" />
                </div>
                <div className="h-16 mt-2">
                  <Line data={prepareGraphData(filteredVideos, 'viewCount')} options={graphOptions} />
                </div>
                <p className="text-sm mt-2 text-white text-opacity-70">
                  Last {selectedTimeFrame === '24h' ? '24 hours' : selectedTimeFrame === '7d' ? '7 days' : '30 days'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-70">Total Likes</p>
                    <p className="text-3xl font-bold mt-1">{totalLikes.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      {likesTrend.percentage > 0 ? (
                        <FaArrowUp className="text-green-400 mr-1" />
                      ) : (
                        <FaArrowDown className="text-red-400 mr-1" />
                      )}
                      <span className={`text-sm ${likesTrend.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(likesTrend.percentage)}%
                      </span>
                    </div>
                  </div>
                  <FaChartLine className="text-white text-opacity-50" />
                </div>
                <div className="h-16 mt-2">
                  <Line data={prepareGraphData(filteredVideos, 'likeCount')} options={graphOptions} />
                </div>
                <p className="text-sm mt-2 text-white text-opacity-70">
                  Last {selectedTimeFrame === '24h' ? '24 hours' : selectedTimeFrame === '7d' ? '7 days' : '30 days'}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium opacity-70">Average VPH</p>
                    <p className="text-3xl font-bold mt-1">{averageVph}</p>
                    <div className="flex items-center mt-1">
                      {vphTrend.percentage > 0 ? (
                        <FaArrowUp className="text-green-400 mr-1" />
                      ) : (
                        <FaArrowDown className="text-red-400 mr-1" />
                      )}
                      <span className={`text-sm ${vphTrend.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(vphTrend.percentage)}%
                      </span>
                    </div>
                  </div>
                  <FaChartLine className="text-white text-opacity-50" />
                </div>
                <div className="h-16 mt-2">
                  <Line data={prepareGraphData(filteredVideos, 'vph')} options={graphOptions} />
                </div>
                <p className="text-sm mt-2 text-white text-opacity-70">
                  Last {selectedTimeFrame === '24h' ? '24 hours' : selectedTimeFrame === '7d' ? '7 days' : '30 days'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
            <h3 className="text-md font-semibold text-blue-800 dark:text-blue-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Understanding Your Metrics
            </h3>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <strong>Views Per Hour (VPH)</strong>: This metric shows how quickly your videos are gaining views, 
              helping you identify which content is currently performing well.
              Higher VPH indicates trending content.
            </p>
          </div>
        </header>
        
        {/* VPH Overview */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
              <h3 className="text-sm font-medium text-white/90">Average VPH</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-white">
                  {Math.round(recentVideos.reduce((sum, video) => sum + video.vph, 0) / Math.max(1, recentVideos.length))}
                </p>
                <p className="ml-2 text-sm text-white/80">views per hour</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
              <h3 className="text-sm font-medium text-white/90">Highest VPH</h3>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold text-white">
                  {recentVideos.length > 0 ? Math.max(...recentVideos.map(v => v.vph)) : 0}
                </p>
                <p className="ml-2 text-sm text-white/80">views per hour</p>
              </div>
              <p className="mt-1 text-xs text-white/90">
                {recentVideos.length > 0 ? recentVideos.reduce((max, video) => max.vph > video.vph ? max : video, recentVideos[0]).title.substring(0, 30) + '...' : 'No videos found'}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/30">
              <h3 className="text-sm font-medium text-white/90">VPH Trend</h3>
              <div className="mt-1 flex items-baseline">
                <p className={`text-2xl font-semibold ${vphTrend.percentage > 0 ? 'text-green-300' : 'text-red-300'}`}>{vphTrend.percentage > 0 ? '+' : ''}{vphTrend.percentage}%</p>
                <p className="ml-2 text-sm text-white/80">from {selectedTimeFrame === '24h' ? 'last day' : selectedTimeFrame === '7d' ? 'last week' : 'last month'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Videos Sections - vertical stack */}
        <div className="space-y-10">
          {/* Top Performing Videos */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 dark:text-white flex items-center">
              Your Top Performing Videos
              <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full px-2 py-1 relative group cursor-help">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-64 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>Videos are ranked using a multi-metric algorithm that considers:</p>
                    <ul className="mt-1 list-disc list-inside">
                      <li>Outlier score (compared to channel median)</li>
                      <li>Engagement rate (likes and comments)</li>
                      <li>Views per hour (VPH)</li>
                      <li>Video recency</li>
                    </ul>
                  </div>
                </div>
              </span>
            </h2>
            {topVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topVideos.slice(0, 4).map((video) => (
                  <VideoGridCard key={video.id} video={video} showVph allVideos={recentVideos} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No videos found.</p>
            )}
          </section>

          {/* Recent Videos */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold dark:text-white">Recent Videos</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400 mr-2">Sort by:</label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                  >
                    <option value="date">Newest First</option>
                    <option value="vph">Highest VPH</option>
                  </select>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button 
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'} rounded-l-xl`}
                    onClick={() => handleViewModeChange('list')}
                    title="List View"
                  >
                    <FaTable size={16} />
                  </button>
                  <button 
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'} rounded-r-xl`}
                    onClick={() => handleViewModeChange('grid')}
                    title="Grid View"
                  >
                    <FaThLarge size={16} />
                  </button>
                </div>
              </div>
            </div>
            {sortedRecentVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedRecentVideos.map((video) => (
                  <VideoGridCard key={video.id} video={video} showVph allVideos={recentVideos} />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No videos found.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  showVph?: boolean;
  allVideos: Video[];
}

function VideoCard({ video, showVph = false, allVideos }: VideoCardProps) {
  const isHighVph = video.vph > 100;
  
  // Calculate outlier score for this video
  const outlierData = calculateOutlierScore(video, allVideos);
  
  // Get performance level from outlier data or calculate if needed
  const performanceLevel = outlierData.performanceLevel;
  
  // Format the score as a whole number
  const score = Math.round(outlierData.score);
  
  // Determine xFactor badge color
  let xColor = 'bg-gray-200 text-gray-800';
  if (outlierData.xFactor > 1.2) xColor = 'bg-blue-200 text-blue-800';
  else if (outlierData.xFactor < 0.8) xColor = 'bg-red-200 text-red-800';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700">
      <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{video.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(video.publishedAt).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
            {video.viewCount.toLocaleString()} views
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
            {video.likeCount.toLocaleString()} likes
          </span>
          {showVph && (
            <>
              <span className={`text-xs ${
                performanceLevel === 'low' ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300' : 
                performanceLevel === 'high' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 
                performanceLevel === 'exceptional' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' : 
                'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
              } rounded-xl px-2 py-1 font-medium relative group cursor-help`}>
                {video.vph.toLocaleString()} VPH
                {performanceLevel === 'exceptional' && <span className="ml-1">🔥</span>}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-48 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>Views Per Hour (VPH) - A metric showing how quickly this video is gaining views.</p>
                    {isHighVph && <p className="mt-1 text-green-300">This video is performing exceptionally well!</p>}
                  </div>
                </div>
              </span>
              
              {/* Outlier Score Badge */}
              <span className={`text-xs font-bold rounded-xl px-2 py-1 ${xColor} relative group cursor-help`} title={`This video has ${(outlierData.xFactor).toFixed(1)}x the views of your channel's median video (${outlierData.medianViews.toLocaleString()} views).`}>
                {outlierData.xFactor.toFixed(1)}x
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-48 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>This video has <b>{outlierData.xFactor.toFixed(1)}x</b> the views of your channel's median video ({outlierData.medianViews.toLocaleString()} views).</p>
                  </div>
                </div>
              </span>
              
              {/* Performance Score Badge - shown only for top videos */}
              {video.performanceScore && (
                <span className="text-xs font-bold rounded-xl px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 relative group cursor-help">
                  {Math.round(video.performanceScore)} Score
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-56 shadow-lg z-10">
                    <div className="relative">
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      <p>Performance Score: {Math.round(video.performanceScore)}/100</p>
                      <p className="mt-1">A comprehensive ranking that combines multiple metrics:</p>
                      <ul className="list-disc list-inside">
                        <li>Outlier score (50%)</li>
                        <li>Engagement rate (30%)</li>
                        <li>VPH (10%)</li>
                        <li>Recency (10%)</li>
                      </ul>
                    </div>
                  </div>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// New Grid Card Component for the grid view
function VideoGridCard({ video, showVph = false, allVideos }: VideoCardProps) {
  const isHighVph = video.vph > 100;
  
  // Calculate outlier score for this video
  const outlierData = calculateOutlierScore(video, allVideos);
  
  // Get performance level from outlier data
  const performanceLevel = outlierData.performanceLevel;
  
  // Format the score as a whole number
  const score = Math.round(outlierData.score);
  
  // Determine xFactor badge color
  let xColor = 'bg-gray-200 text-gray-800';
  if (outlierData.xFactor > 1.2) xColor = 'bg-blue-200 text-blue-800';
  else if (outlierData.xFactor < 0.8) xColor = 'bg-red-200 text-red-800';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-200 dark:border-gray-700">
      <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{video.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(video.publishedAt).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
            {video.viewCount.toLocaleString()} views
          </span>
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
            {video.likeCount.toLocaleString()} likes
          </span>
          {showVph && (
            <>
              <span className={`text-xs ${
                performanceLevel === 'low' ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300' : 
                performanceLevel === 'high' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 
                performanceLevel === 'exceptional' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' : 
                'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
              } rounded-xl px-2 py-1 font-medium relative group cursor-help`}>
                {video.vph.toLocaleString()} VPH
                {performanceLevel === 'exceptional' && <span className="ml-1">🔥</span>}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-48 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>Views Per Hour (VPH) - A metric showing how quickly this video is gaining views.</p>
                    {isHighVph && <p className="mt-1 text-green-300">This video is performing exceptionally well!</p>}
                  </div>
                </div>
              </span>
              
              {/* Outlier Score Badge */}
              <span className={`text-xs font-bold rounded-xl px-2 py-1 ${xColor} relative group cursor-help`} title={`This video has ${(outlierData.xFactor).toFixed(1)}x the views of your channel's median video (${outlierData.medianViews.toLocaleString()} views).`}>
                {outlierData.xFactor.toFixed(1)}x
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-48 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>This video has <b>{outlierData.xFactor.toFixed(1)}x</b> the views of your channel's median video ({outlierData.medianViews.toLocaleString()} views).</p>
                  </div>
                </div>
              </span>
              
              {/* Performance Score Badge - shown only for top videos */}
              {video.performanceScore && (
                <span className="text-xs font-bold rounded-xl px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 relative group cursor-help">
                  {Math.round(video.performanceScore)} Score
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-56 shadow-lg z-10">
                    <div className="relative">
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      <p>Performance Score: {Math.round(video.performanceScore)}/100</p>
                      <p className="mt-1">A comprehensive ranking that combines multiple metrics:</p>
                      <ul className="list-disc list-inside">
                        <li>Outlier score (50%)</li>
                        <li>Engagement rate (30%)</li>
                        <li>VPH (10%)</li>
                        <li>Recency (10%)</li>
                      </ul>
                    </div>
                  </div>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 