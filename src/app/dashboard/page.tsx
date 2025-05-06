'use client';

import { useState, useEffect } from 'react';
import { Video, Alert } from '@/types';
import { videosApi, alertsApi } from '@/services/api';
import { FaTable, FaThLarge } from 'react-icons/fa';

type SortOption = 'date' | 'vph';
type ViewMode = 'list' | 'grid';

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [topVideos, setTopVideos] = useState<Video[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentVideosData, topVideosData, alertsData] = await Promise.all([
          videosApi.getRecentVideos(5), // Increased to 5 videos
          videosApi.getTopPerformingVideos(3),
          alertsApi.getUnreadAlerts()
        ]);
        
        setRecentVideos(recentVideosData);
        setTopVideos(topVideosData);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  // Calculate channel statistics
  const totalViews = recentVideos.reduce((sum, video) => sum + video.viewCount, 0);
  const totalLikes = recentVideos.reduce((sum, video) => sum + video.likeCount, 0);
  const averageVph = Math.round(recentVideos.reduce((sum, video) => sum + video.vph, 0) / Math.max(1, recentVideos.length));

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
          <div className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Channel Summary</h2>
                <p className="opacity-80 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 px-4 py-2 rounded-xl text-sm font-medium">
                  Refresh Data
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <p className="text-sm font-medium opacity-70">Total Views</p>
                <p className="text-3xl font-bold mt-1">{totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <p className="text-sm font-medium opacity-70">Total Likes</p>
                <p className="text-3xl font-bold mt-1">{totalLikes.toLocaleString()}</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                <p className="text-sm font-medium opacity-70">Average VPH</p>
                <p className="text-3xl font-bold mt-1">{averageVph}</p>
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
        {!isLoading && (
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-900">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average VPH</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                    {Math.round(recentVideos.reduce((sum, video) => sum + video.vph, 0) / Math.max(1, recentVideos.length))}
                  </p>
                  <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">views per hour</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-purple-200 dark:border-purple-900">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Highest VPH</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                    {recentVideos.length > 0 ? Math.max(...recentVideos.map(v => v.vph)) : 0}
                  </p>
                  <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">views per hour</p>
                </div>
                <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                  {recentVideos.length > 0 ? 
                    recentVideos.reduce((max, video) => max.vph > video.vph ? max : video, recentVideos[0]).title.substring(0, 30) + '...' 
                    : 'No videos found'}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-green-200 dark:border-green-900">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">VPH Trend</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    +12%
                  </p>
                  <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">from last week</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Alerts Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Recent Alerts</h2>
          {alerts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900 hover:shadow-md transition-shadow duration-200">
                  <span className="inline-block rounded-xl bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    {alert.type.toUpperCase()} Alert
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">{alert.message}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(alert.createdAt).toLocaleDateString()} at {new Date(alert.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No new alerts.</p>
          )}
        </section>

        {/* Videos Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              viewMode === 'list' ? (
                <div className="space-y-4">
                  {sortedRecentVideos.map((video) => (
                    <VideoCard key={video.id} video={video} showVph />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedRecentVideos.map((video) => (
                    <VideoGridCard key={video.id} video={video} showVph />
                  ))}
                </div>
              )
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No videos found.</p>
            )}
          </section>

          {/* Top Performing Videos */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">Top Performing Videos</h2>
            {topVideos.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-4">
                  {topVideos.map((video) => (
                    <VideoCard key={video.id} video={video} showVph />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topVideos.map((video) => (
                    <VideoGridCard key={video.id} video={video} showVph />
                  ))}
                </div>
              )
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
}

function VideoCard({ video, showVph = false }: VideoCardProps) {
  // Determine if VPH is considered high (for example, over 100)
  const isHighVph = video.vph > 100;
  
  // Simulate VPH trend (in a real app, this would be calculated from historical data)
  // For demo purposes, we'll create a random trend for now
  const vphTrend = Math.random() > 0.5 ? 'up' : 'down';
  const trendPercent = Math.floor(Math.random() * 20) + 1; // 1-20%
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border ${isHighVph && showVph ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex">
        <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
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
              <span className={`text-xs ${isHighVph ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'} rounded-xl px-2 py-1 font-medium relative group cursor-help`}>
                {video.vph.toLocaleString()} VPH
                {isHighVph && <span className="ml-1">🔥</span>}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-xl p-2 w-48 shadow-lg z-10">
                  <div className="relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    <p>Views Per Hour (VPH) - A metric showing how quickly this video is gaining views.</p>
                    {isHighVph && <p className="mt-1 text-green-300">This video is performing exceptionally well!</p>}
                  </div>
                </div>
              </span>
            )}
            {showVph && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                {vphTrend === 'up' ? (
                  <span className="text-green-600 dark:text-green-400">↑ {trendPercent}%</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">↓ {trendPercent}%</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// New Grid Card Component for the grid view
function VideoGridCard({ video, showVph = false }: VideoCardProps) {
  const isHighVph = video.vph > 100;
  const vphTrend = Math.random() > 0.5 ? 'up' : 'down';
  const trendPercent = Math.floor(Math.random() * 20) + 1;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border ${isHighVph && showVph ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'} hover:shadow-md transition-shadow duration-200 flex flex-col h-full`}>
      <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">{video.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(video.publishedAt).toLocaleDateString()}</p>
        
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
              {video.viewCount.toLocaleString()} views
            </span>
            {showVph && (
              <span className={`text-xs ${isHighVph ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'} rounded-xl px-2 py-1 font-medium`}>
                {video.vph.toLocaleString()} VPH {isHighVph && '🔥'}
              </span>
            )}
            {showVph && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                {vphTrend === 'up' ? (
                  <span className="text-green-600 dark:text-green-400">↑ {trendPercent}%</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">↓ {trendPercent}%</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 