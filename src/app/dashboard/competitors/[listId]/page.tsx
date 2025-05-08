'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTimes, FaYoutube, FaEllipsisV, FaChartBar, FaDownload, FaFilter, FaChevronDown, FaStar, FaRocket, FaTrophy, FaCheck, FaCalendarAlt, FaEye, FaEyeSlash, FaThLarge, FaSearch, FaExternalLinkAlt, FaPlay, FaBookmark, FaClipboard, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import { Competitor, Video } from '@/types';
import { videosApi } from '@/services/api';
import { getUseRealApi } from '@/services/api/config';
import { competitorListsApi } from '@/services/api/competitorLists';
import { secureYoutubeService } from '@/services/api/youtube-secure';

// Format number to compact form
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Define the search result type
interface ChannelSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount?: string;
}

export default function CompetitorListDetail({ params }: { params: { listId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listName = searchParams.get('name') || 'Competitor List';
  
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompetitorId, setNewCompetitorId] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [channelSearchResults, setChannelSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRealApi] = useState(getUseRealApi());
  const [chartMetric, setChartMetric] = useState('Subscribers');
  const [subscribersOnly, setSubscribersOnly] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modified filter states to use ranges (min and max values)
  const [viewsRange, setViewsRange] = useState<[number, number]>([0, 500000000]); // Min and max views
  const [subscribersRange, setSubscribersRange] = useState<[number, number]>([0, 500000000]); // Min and max subscribers
  const [videoDurationRange, setVideoDurationRange] = useState<[number, number]>([0, 1440]); // Min and max duration (in minutes)
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    new Date().toISOString().split('T')[0] // today
  ]);

  // Add new state for view multiplier as a range
  const [viewMultiplierRange, setViewMultiplierRange] = useState<[number, number]>([0, 500]); // Min and max multiplier

  // State for advanced filters - also using ranges
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState<boolean>(false);
  const [channelAgeRange, setChannelAgeRange] = useState<[number, number]>([0, 120]); // Min and max age (in months)
  const [videoCommentsRange, setVideoCommentsRange] = useState<[number, number]>([0, 200000]); // Min and max comments
  const [videoLikesRange, setVideoLikesRange] = useState<[number, number]>([0, 1000000]); // Min and max likes
  const [videoCountRange, setVideoCountRange] = useState<[number, number]>([0, 1000]); // Min and max video count
  const [totalChannelViewsRange, setTotalChannelViewsRange] = useState<[number, number]>([0, 1000000000]); // Min and max channel views
  const [includeKeywords, setIncludeKeywords] = useState<string>("");
  const [excludeKeywords, setExcludeKeywords] = useState<string>("");

  // Add new state variables for similar videos section
  const [competitorVideos, setCompetitorVideos] = useState<Video[]>([]);
  const [similarVideos, setSimilarVideos] = useState<Video[]>([]);
  const [videoGridColumns, setVideoGridColumns] = useState<number>(6); // Default to 6 columns for video grid
  const [showVideoInfo, setShowVideoInfo] = useState<boolean>(true);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  const [activeVideoTab, setActiveVideoTab] = useState<'competitors' | 'similar'>('competitors');
  
  // Add states for the video context menu
  const [showVideoContextMenu, setShowVideoContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // State for filter settings
  const [minSubscribers, setMinSubscribers] = useState<number>(0);
  
  // State for loading videos
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);

  // Add new state for filtered competitors and videos
  const [filteredCompetitorIds, setFilteredCompetitorIds] = useState<string[]>([]);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Call the check on mount
  useEffect(() => {
    fetchCompetitors();
  }, []);
  
  // Add a useEffect to handle clicks outside the context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowVideoContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCompetitors = async () => {
    try {
      setIsLoading(true);
      
      console.log(`Fetching competitors for list ${params.listId}...`);
      
      // Get the competitor list from Supabase
      try {
        const competitors = await competitorListsApi.getCompetitorsInList(params.listId);
        console.log(`Found ${competitors.length} competitors in list ${params.listId}`);
        
        // Convert from DB format to our app format
        const formattedCompetitors: Competitor[] = [];
        
        // For each competitor, get fresh data from YouTube
        for (const c of competitors) {
          try {
            // Try to get fresh data from YouTube
            console.log(`Fetching updated data for channel ${c.name} (${c.youtubeId})...`);
            const channelData = await secureYoutubeService.getChannelById(c.youtubeId);
            
            // Use the fresh data but keep our database ID
            formattedCompetitors.push({
              id: c.id,
              youtubeId: c.youtubeId,
              name: channelData.name,
              thumbnailUrl: channelData.thumbnailUrl,
              subscriberCount: channelData.subscriberCount,
              videoCount: channelData.videoCount,
              viewCount: channelData.viewCount
            });
            
            console.log(`Updated data received for ${channelData.name}`);
          } catch (error) {
            console.error(`Error fetching data for channel ${c.youtubeId}:`, error);
            
            // Fall back to database data if YouTube API fails
            formattedCompetitors.push({
              id: c.id,
              youtubeId: c.youtubeId,
              name: c.name,
              thumbnailUrl: c.thumbnailUrl || '',
              subscriberCount: c.subscriberCount || 0,
              videoCount: c.videoCount || 0,
              viewCount: c.viewCount || 0
            });
          }
        }
        
        setCompetitors(formattedCompetitors);
        
        // After getting competitors, fetch their videos
        if (formattedCompetitors.length > 0) {
          fetchCompetitorVideos(formattedCompetitors);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching competitors for list:', error);
        if (error instanceof Error && error.message.includes('not found')) {
          // List not found, redirect to the main competitors page
          router.push('/dashboard/competitors');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchCompetitors:', error);
      setIsLoading(false);
    }
  };
  
  const fetchCompetitorVideos = async (competitorsList: Competitor[]) => {
    try {
      setIsVideoLoading(true);
      const allVideos: Video[] = [];
      
      // Process all competitors
      const competitorsToFetch = competitorsList;
      
      // Fetch videos for each competitor (10 videos per competitor)
      for (const competitor of competitorsToFetch) {
        try {
          console.log(`Fetching videos for channel ${competitor.name} (${competitor.youtubeId})...`);
          const videos = await secureYoutubeService.getVideosByChannelId(competitor.youtubeId, 10);
          allVideos.push(...videos);
          console.log(`Found ${videos.length} videos for channel ${competitor.name}`);
        } catch (error) {
          console.error(`Error fetching videos for channel ${competitor.youtubeId}:`, error);
        }
      }
      
      // Sort videos by published date (newest first)
      const sortedVideos = allVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      setCompetitorVideos(sortedVideos);
      setIsVideoLoading(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching competitor videos:', error);
      setIsVideoLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
      // First get the channel data from YouTube
      let channelData;
      try {
        console.log(`Fetching channel data for ${newCompetitorId}...`);
        channelData = await secureYoutubeService.getChannelById(newCompetitorId);
        console.log('Channel data retrieved:', channelData);
      } catch (channelError) {
        console.error('Error fetching channel data from YouTube:', channelError);
        setError('Could not fetch channel information. Please check the channel ID and try again.');
        setIsAdding(false);
        return;
      }
      
      // Now use the data from YouTube to add to the competitor list
      const competitorData = {
        youtubeId: channelData.youtubeId,
        name: channelData.name,
        thumbnailUrl: channelData.thumbnailUrl,
        subscriberCount: channelData.subscriberCount,
        videoCount: channelData.videoCount,
        viewCount: channelData.viewCount
      };
      
      // Add to competitor list in Supabase
      const competitor = await competitorListsApi.addCompetitorToList(
        params.listId,
        competitorData
      );
      
      // Convert from the TrackedCompetitor type to Competitor type for UI
      const newCompetitor: Competitor = {
        id: competitor.id,
        youtubeId: competitor.youtubeId,
        name: competitor.name,
        thumbnailUrl: competitor.thumbnailUrl || '',
        subscriberCount: competitor.subscriberCount || 0,
        videoCount: competitor.videoCount || 0,
        viewCount: competitor.viewCount || 0
      };
      
      setCompetitors(prev => [...prev, newCompetitor]);
      
      // Fetch videos for the new competitor
      try {
        const videos = await secureYoutubeService.getVideosByChannelId(newCompetitor.youtubeId, 10);
        setCompetitorVideos(prev => [...videos, ...prev]);
      } catch (videoError) {
        console.error('Error fetching videos for new competitor:', videoError);
      }
      
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
      // Find the competitor being removed to get its youtubeId
      const competitorToRemove = competitors.find(comp => comp.id === id);
      
      // Remove the competitor using the direct API instead of the adapter
      await competitorListsApi.removeCompetitorFromList(id);
      
      // Update the competitors list in UI
      setCompetitors(prev => prev.filter(competitor => competitor.id !== id));
      
      // If we found the competitor, also remove its videos from the Related Videos section
      if (competitorToRemove) {
        // Filter out any videos that belong to this competitor's channel
        setCompetitorVideos(prev => 
          prev.filter(video => video.channelId !== competitorToRemove.youtubeId)
        );
      }
    } catch (error) {
      console.error('Error removing competitor:', error);
    }
  };

  // Function to determine icon based on subscriber count or other metrics
  const getCompetitorIcon = (competitor: Competitor) => {
    const { subscriberCount, viewCount } = competitor;
    
    // Top tier - over 1M subscribers
    if (subscriberCount >= 1000000) {
      return <FaStar size={16} className="text-yellow-500" />;
    }
    
    // High growth - high view to subscriber ratio
    if (viewCount / subscriberCount > 100) {
      return <FaRocket size={16} className="text-red-500" />;
    }
    
    // Good performer - over 100K subscribers
    if (subscriberCount >= 100000) {
      return <FaTrophy size={16} className="text-indigo-500" />;
    }
    
    // Default
    return <FaCheck size={16} className="text-green-500" />;
  };

  // Function to handle filter apply - updated for ranges
  const applyFilter = () => {
    // Check if any filters are actually set
    const hasActiveFilters = 
      viewsRange[0] > 0 || viewsRange[1] < 500000000 || 
      subscribersRange[0] > 0 || subscribersRange[1] < 500000000 || 
      videoDurationRange[0] > 0 || videoDurationRange[1] < 1440 || 
      viewMultiplierRange[0] > 0 || viewMultiplierRange[1] < 500 || 
      includeKeywords.trim() !== '' || excludeKeywords.trim() !== '';
    
    if (!hasActiveFilters) {
      // If no active filters, just reset the filter state
      setFilteredCompetitorIds([]);
      setIsFilterActive(false);
      setIsFilterOpen(false);
      return;
    }
    
    // Filter the competitors based on the selected criteria
    const filteredIds = competitors
      .filter(competitor => {
        // Filter competitors based on range values
        const meetsViewsRange = 
          competitor.viewCount >= viewsRange[0] && 
          competitor.viewCount <= viewsRange[1];
          
        const meetsSubscribersRange = 
          competitor.subscriberCount >= subscribersRange[0] && 
          competitor.subscriberCount <= subscribersRange[1];
        
        // We could add more filters here as needed
        
        return meetsViewsRange && meetsSubscribersRange;
      })
      .map(competitor => competitor.youtubeId);
    
    setFilteredCompetitorIds(filteredIds);
    setIsFilterActive(true);
    console.log(`Filter applied: ${filteredIds.length} competitors matching criteria`);
    setIsFilterOpen(false);
  };

  // Function to reset filters - updated for ranges
  const resetFilter = () => {
    setViewsRange([0, 500000000]);
    setSubscribersRange([0, 500000000]);
    setVideoDurationRange([0, 1440]);
    setViewMultiplierRange([0, 500]);
    setDateRange([
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    ]);
    
    // Reset advanced filters
    setChannelAgeRange([0, 120]);
    setVideoCommentsRange([0, 200000]);
    setVideoLikesRange([0, 1000000]);
    setVideoCountRange([0, 1000]);
    setTotalChannelViewsRange([0, 1000000000]);
    setIncludeKeywords("");
    setExcludeKeywords("");
    
    // Clear the filter state
    setFilteredCompetitorIds([]);
    setIsFilterActive(false);
  };

  // Helper function to safely parse input values
  const safeParseInt = (value: string, fallback = 0): number => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Helper function to calculate appropriate step based on value range
  const calculateStep = (value: number, min: number, max: number, baseStep: number = 1): number => {
    const range = max - min;
    const percentage = (value - min) / range;
    
    if (percentage < 0.1) return baseStep / 10; // Fine control at the beginning
    if (percentage < 0.3) return baseStep;      // Normal control in lower range
    if (percentage < 0.7) return baseStep * 5;  // Medium control in middle range
    return baseStep * 10;                       // Coarse control in high range
  };

  // Views range slider step functions - update for min/max
  const getViewsStep = (value: number): number => {
    if (value < 1000000) return 50000;       // 0-1M: steps of 50K
    if (value < 10000000) return 500000;     // 1M-10M: steps of 500K
    if (value < 50000000) return 1000000;    // 10M-50M: steps of 1M
    if (value < 100000000) return 5000000;   // 50M-100M: steps of 5M
    return 10000000;                         // 100M+: steps of 10M
  };

  // Subscribers range slider step functions
  const getSubscribersStep = (value: number): number => {
    if (value < 100000) return 5000;       // 0-100K: steps of 5K
    if (value < 1000000) return 50000;     // 100K-1M: steps of 50K
    if (value < 10000000) return 500000;   // 1M-10M: steps of 500K
    if (value < 100000000) return 5000000; // 10M-100M: steps of 5M
    return 10000000;                       // 100M+: steps of 10M
  };

  // Video duration range slider step functions
  const getVideoDurationStep = (value: number): number => {
    if (value < 60) return 1;         // 0-1hr: steps of 1 minute
    if (value < 180) return 5;        // 1-3hrs: steps of 5 minutes
    if (value < 360) return 10;       // 3-6hrs: steps of 10 minutes
    if (value < 720) return 30;       // 6-12hrs: steps of 30 minutes
    return 60;                        // 12hr+: steps of 60 minutes (1 hour)
  };

  // View multiplier range slider step functions
  const getViewMultiplierStep = (value: number): number => {
    if (value < 5) return 0.1;       // 0-5x: steps of 0.1
    if (value < 20) return 0.5;      // 5-20x: steps of 0.5
    if (value < 100) return 1;       // 20-100x: steps of 1
    if (value < 200) return 5;       // 100-200x: steps of 5
    return 10;                       // 200x+: steps of 10
  };

  // Channel age range step function
  const getChannelAgeStep = (value: number): number => {
    if (value < 12) return 1;        // 0-12 months: steps of 1 month
    if (value < 36) return 3;        // 1-3 years: steps of 3 months
    if (value < 60) return 6;        // 3-5 years: steps of 6 months
    return 12;                       // 5+ years: steps of 1 year
  };

  // Video comments range step function
  const getVideoCommentsStep = (value: number): number => {
    if (value < 1000) return 50;
    if (value < 10000) return 500;
    if (value < 100000) return 5000;
    return 10000;
  };

  // Video likes range step function
  const getVideoLikesStep = (value: number): number => {
    if (value < 1000) return 100;
    if (value < 10000) return 500;
    if (value < 100000) return 5000;
    return 10000;
  };

  // Video count range step function
  const getVideoCountStep = (value: number): number => {
    if (value < 100) return 5;
    if (value < 500) return 25;
    if (value < 1000) return 50;
    return 100;
  };

  // Total channel views range step function
  const getTotalChannelViewsStep = (value: number): number => {
    if (value < 1000000) return 100000;
    if (value < 10000000) return 500000;
    if (value < 100000000) return 5000000;
    return 10000000;
  };

  // Handler functions for advanced filters using ranges
  const handleChannelAgeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setChannelAgeRange([value, channelAgeRange[1]]);
    }
  };

  const handleChannelAgeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setChannelAgeRange([channelAgeRange[0], value]);
    }
  };

  const handleVideoCommentsMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCommentsRange([value, videoCommentsRange[1]]);
    }
  };

  const handleVideoCommentsMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCommentsRange([videoCommentsRange[0], value]);
    }
  };

  const handleVideoLikesMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoLikesRange([value, videoLikesRange[1]]);
    }
  };

  const handleVideoLikesMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoLikesRange([videoLikesRange[0], value]);
    }
  };

  const handleVideoCountMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCountRange([value, videoCountRange[1]]);
    }
  };

  const handleVideoCountMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCountRange([videoCountRange[0], value]);
    }
  };

  const handleTotalChannelViewsMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTotalChannelViewsRange([value, totalChannelViewsRange[1]]);
    }
  };

  const handleTotalChannelViewsMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTotalChannelViewsRange([totalChannelViewsRange[0], value]);
    }
  };

  // Function to handle changing the video grid layout
  const handleVideoGridColumnsChange = (columns: number) => {
    setVideoGridColumns(columns);
  };

  // Function to toggle video info display
  const toggleVideoInfo = () => {
    setShowVideoInfo(!showVideoInfo);
  };

  // Function to open video on YouTube
  const openVideoOnYouTube = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };
  
  // Function to handle right-click on videos
  const handleVideoContextMenu = (event: React.MouseEvent, videoId: string) => {
    event.preventDefault(); // Prevent the default browser context menu
    setSelectedVideoId(videoId);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowVideoContextMenu(true);
  };

  // Update the video filtering logic to also account for keywords
  const filteredVideos = activeVideoTab === 'competitors' 
    ? competitorVideos
        .filter(video => {
          // Text search filter 
          const matchesSearch = video.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
                               (video.description?.toLowerCase().includes(videoSearchQuery.toLowerCase() || ''));
          
          // Channel filter (if active)
          const matchesChannelFilter = !isFilterActive || filteredCompetitorIds.includes(video.channelId);
          
          // Keywords filtering (if active)
          let matchesKeywords = true;
          if (isFilterActive && includeKeywords.trim()) {
            const keywordsToInclude = includeKeywords.split(',').map(k => k.trim().toLowerCase());
            matchesKeywords = keywordsToInclude.some(keyword => 
              video.title.toLowerCase().includes(keyword) || 
              (video.description?.toLowerCase().includes(keyword) || false)
            );
          }
          
          // Excluded keywords filtering (if active)
          let noExcludedKeywords = true;
          if (isFilterActive && excludeKeywords.trim()) {
            const keywordsToExclude = excludeKeywords.split(',').map(k => k.trim().toLowerCase());
            noExcludedKeywords = !keywordsToExclude.some(keyword => 
              video.title.toLowerCase().includes(keyword) || 
              (video.description?.toLowerCase().includes(keyword) || false)
            );
          }
          
          return matchesSearch && matchesChannelFilter && matchesKeywords && noExcludedKeywords;
        })
    : similarVideos.filter(video => 
        video.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
        video.description?.toLowerCase().includes(videoSearchQuery.toLowerCase() || '')
      );
      
  // Updated function to group videos by channel and apply filters
  const getVideosByChannel = () => {
    const channelGroups: { [channelId: string]: { channel: Competitor | null, videos: Video[] } } = {};
    
    // Group videos by channel ID
    filteredVideos.forEach(video => {
      if (!channelGroups[video.channelId]) {
        // Find matching competitor for the channel
        const matchingCompetitor = competitors.find(comp => comp.youtubeId === video.channelId);
        
        channelGroups[video.channelId] = {
          channel: matchingCompetitor || null,
          videos: []
        };
      }
      
      channelGroups[video.channelId].videos.push(video);
    });
    
    // Convert object to array and sort by channel name
    return Object.values(channelGroups)
      .filter(group => group.videos.length > 0)
      .sort((a, b) => {
        const nameA = a.channel?.name || '';
        const nameB = b.channel?.name || '';
        return nameA.localeCompare(nameB);
      });
  };

  // Add a new search function for channels
  const searchChannels = async (query: string) => {
    if (!query || query.length < 3) {
      setChannelSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&type=channel&maxResults=5`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      // Format results
      const formattedResults: ChannelSearchResult[] = data.items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.default.url
      }));
      
      setChannelSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching channels:', error);
      setError('Failed to search channels. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (channelSearchQuery) {
        searchChannels(channelSearchQuery);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [channelSearchQuery]);

  // Select a channel from search results
  const selectChannel = (channel: ChannelSearchResult) => {
    setNewCompetitorId(channel.id);
    setChannelSearchQuery(channel.title);
    setChannelSearchResults([]);
  };

  // Handle direct channel ID input changes
  const handleChannelIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCompetitorId(e.target.value);
    // Clear the search query if user is manually entering a channel ID
    if (e.target.value) {
      setChannelSearchQuery('');
      setChannelSearchResults([]);
    }
  };

  // Add a function to count how many videos would match the current filter settings - updated for ranges
  const countMatchingVideos = () => {
    if (!isFilterOpen) return 0;
    
    // Check if any filters are set
    const hasActiveFilters = 
      viewsRange[0] > 0 || viewsRange[1] < 500000000 || 
      subscribersRange[0] > 0 || subscribersRange[1] < 500000000;
    
    if (!hasActiveFilters) {
      return competitorVideos.length;
    }
    
    const matchingCompetitors = competitors
      .filter(competitor => {
        // Filter competitors based on range values
        const meetsViewsRange = 
          competitor.viewCount >= viewsRange[0] && 
          competitor.viewCount <= viewsRange[1];
          
        const meetsSubscribersRange = 
          competitor.subscriberCount >= subscribersRange[0] && 
          competitor.subscriberCount <= subscribersRange[1];
          
        return meetsViewsRange && meetsSubscribersRange;
      })
      .map(comp => comp.youtubeId);
    
    // Count videos from these channels
    return competitorVideos.filter(video => matchingCompetitors.includes(video.channelId)).length;
  };

  // Handler functions for range sliders
  const handleViewsMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setViewsRange([value, viewsRange[1]]);
    }
  };

  const handleViewsMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setViewsRange([viewsRange[0], value]);
    }
  };

  const handleSubscribersMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setSubscribersRange([value, subscribersRange[1]]);
    }
  };

  const handleSubscribersMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setSubscribersRange([subscribersRange[0], value]);
    }
  };

  const handleVideoDurationMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoDurationRange([value, videoDurationRange[1]]);
    }
  };

  const handleVideoDurationMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoDurationRange([videoDurationRange[0], value]);
    }
  };

  const handleViewMultiplierMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setViewMultiplierRange([value, viewMultiplierRange[1]]);
    }
  };

  const handleViewMultiplierMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setViewMultiplierRange([viewMultiplierRange[0], value]);
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

      {/* Tracked Channels section (formerly Performance Analytics) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FaYoutube className="text-red-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Tracked Channels <span className="text-gray-500 dark:text-gray-400 font-normal text-base">({competitors.length})</span>
            </h2>
            <div className="text-gray-400 dark:text-gray-500 cursor-help" title="Channels you're currently tracking in this list">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-sm transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus size={14} />
              <span className="text-xs sm:text-sm">Add channel</span>
            </button>
          </div>
        </div>

        {/* Channel analytics table with scrolling for >4 channels */}
        <div className={`${competitors.length > 4 ? 'max-h-[400px] overflow-y-auto pr-2' : ''} overflow-x-auto`}>
          <table className="min-w-full">
            <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Channel</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Subscribers</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Videos</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Views</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Engagement</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Growth</th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map(competitor => {
                // Calculate average views per video
                const avgViews = Math.round(competitor.viewCount / Math.max(competitor.videoCount, 1));
                
                // Calculate fake engagement rate (comments + likes) / views
                // In a real app, this would come from actual data
                const engagementRate = (Math.random() * 10 + 2).toFixed(1);
                
                // Fake growth rate for demo purposes
                const growthRate = (Math.random() * 16 - 5).toFixed(1);
                const isPositiveGrowth = parseFloat(growthRate) > 0;
                
                return (
                  <tr key={competitor.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <img src={competitor.thumbnailUrl} alt={competitor.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <a 
                            href={`https://youtube.com/channel/${competitor.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                          >
                            {competitor.name}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatNumber(competitor.subscriberCount)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-800 dark:text-gray-200">{competitor.videoCount.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-800 dark:text-gray-200">{formatNumber(avgViews)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" 
                            style={{ width: `${Math.min(parseFloat(engagementRate) * 10, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-800 dark:text-gray-200">{engagementRate}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {isPositiveGrowth ? (
                          <span className="text-green-600 dark:text-green-500">↑</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-500">↓</span>
                        )}
                        <span className={isPositiveGrowth ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                          {isPositiveGrowth ? '+' : ''}{growthRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="relative inline-block">
                        <button 
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                          onClick={() => handleRemoveCompetitor(competitor.id)}
                          title="Remove this channel"
                        >
                          <FaTimes size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {competitors.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No channels tracked yet.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
              >
                Add your first channel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suggested competitors section - REMOVED */}

      {/* New Filter Popup */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsFilterOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FaTimes size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Filter Competitors
            </h3>
            
            {/* Updated helper note */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Use the sliders to set a range of values for each filter. Videos will be shown if their values fall within your selected ranges.
            </p>
            
            {/* Add a video count preview */}
            <div className="mb-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-700 dark:text-indigo-300 text-sm">
              <span className="font-medium">Preview:</span> {
                viewsRange[0] === 0 && viewsRange[1] === 500000000 && 
                subscribersRange[0] === 0 && subscribersRange[1] === 500000000 && 
                viewMultiplierRange[0] === 0 && viewMultiplierRange[1] === 500
                  ? `No filters applied. Showing all ${competitorVideos.length} videos from ${competitors.length} channels.`
                  : `Your current filter settings will show approximately ${countMatchingVideos()} videos from ${
                      competitors.filter(c => 
                        c.viewCount >= viewsRange[0] && c.viewCount <= viewsRange[1] && 
                        c.subscriberCount >= subscribersRange[0] && c.subscriberCount <= subscribersRange[1]
                      ).length
                    } channels.`
              }
            </div>
            
            <div className="grid grid-cols-3 gap-8">
              {/* Left column with sliders */}
              <div className="col-span-2 space-y-8">
                {/* Views range slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Views: {formatNumber(viewsRange[0])} - {formatNumber(viewsRange[1])}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>500M</span>
                    </div>
                    
                    {/* Min Views Slider */}
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Min:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="100000" 
                        value={viewsRange[0]}
                        onChange={handleViewsMinChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Max Views Slider */}
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Max:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="100000" 
                        value={viewsRange[1]}
                        onChange={handleViewsMaxChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Direct input for min/max values */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom range:</label>
                      <input
                        type="number"
                        min="0"
                        max={viewsRange[1]}
                        value={viewsRange[0]}
                        onChange={(e) => {
                          const value = safeParseInt(e.target.value, 0);
                          setViewsRange([value, Math.max(value, viewsRange[1])]);
                        }}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white mr-2"
                        placeholder="Min"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mx-2">to</span>
                      <input
                        type="number"
                        min={viewsRange[0]}
                        max="500000000"
                        value={viewsRange[1]}
                        onChange={(e) => {
                          const value = safeParseInt(e.target.value, 500000000);
                          setViewsRange([Math.min(viewsRange[0], value), value]);
                        }}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Subscribers range slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Subscribers: {formatNumber(subscribersRange[0])} - {formatNumber(subscribersRange[1])}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>500M</span>
                    </div>
                    
                    {/* Min Subscribers Slider */}
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Min:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="10000" 
                        value={subscribersRange[0]}
                        onChange={handleSubscribersMinChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Max Subscribers Slider */}
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Max:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500000000" 
                        step="10000" 
                        value={subscribersRange[1]}
                        onChange={handleSubscribersMaxChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Direct input for min/max values */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom range:</label>
                      <input
                        type="number"
                        min="0"
                        max={subscribersRange[1]}
                        value={subscribersRange[0]}
                        onChange={(e) => {
                          const value = safeParseInt(e.target.value, 0);
                          setSubscribersRange([value, Math.max(value, subscribersRange[1])]);
                        }}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white mr-2"
                        placeholder="Min"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mx-2">to</span>
                      <input
                        type="number"
                        min={subscribersRange[0]}
                        max="500000000"
                        value={subscribersRange[1]}
                        onChange={(e) => {
                          const value = safeParseInt(e.target.value, 500000000);
                          setSubscribersRange([Math.min(subscribersRange[0], value), value]);
                        }}
                        className="w-32 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Video Duration range slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Video Duration: {Math.floor(videoDurationRange[0] / 60)}h {videoDurationRange[0] % 60}m - {Math.floor(videoDurationRange[1] / 60)}h {videoDurationRange[1] % 60}m
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>24h</span>
                    </div>
                    
                    {/* Min Duration Slider */}
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Min:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1440" 
                        step="10" 
                        value={videoDurationRange[0]}
                        onChange={handleVideoDurationMinChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Max Duration Slider */}
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Max:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="1440" 
                        step="10" 
                        value={videoDurationRange[1]}
                        onChange={handleVideoDurationMaxChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Added input fields for direct value entry with hours and minutes */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Minimum duration:</label>
                        <div className="flex">
                          <div className="flex items-center mr-2">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={Math.floor(videoDurationRange[0] / 60)}
                              onChange={(e) => {
                                const hours = safeParseInt(e.target.value, 0);
                                const minutes = videoDurationRange[0] % 60;
                                const newMinutes = Math.min(hours, 24) * 60 + minutes;
                                setVideoDurationRange([newMinutes, Math.max(newMinutes, videoDurationRange[1])]);
                              }}
                              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                            />
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">h</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={videoDurationRange[0] % 60}
                              onChange={(e) => {
                                const hours = Math.floor(videoDurationRange[0] / 60);
                                const minutes = safeParseInt(e.target.value, 0);
                                const newMinutes = hours * 60 + Math.min(minutes, 59);
                                setVideoDurationRange([newMinutes, Math.max(newMinutes, videoDurationRange[1])]);
                              }}
                              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                            />
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">m</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Maximum duration:</label>
                        <div className="flex">
                          <div className="flex items-center mr-2">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={Math.floor(videoDurationRange[1] / 60)}
                              onChange={(e) => {
                                const hours = safeParseInt(e.target.value, 24);
                                const minutes = videoDurationRange[1] % 60;
                                const newMinutes = Math.min(hours, 24) * 60 + minutes;
                                setVideoDurationRange([Math.min(videoDurationRange[0], newMinutes), newMinutes]);
                              }}
                              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                            />
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">h</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={videoDurationRange[1] % 60}
                              onChange={(e) => {
                                const hours = Math.floor(videoDurationRange[1] / 60);
                                const minutes = safeParseInt(e.target.value, 0);
                                const newMinutes = hours * 60 + Math.min(minutes, 59);
                                setVideoDurationRange([Math.min(videoDurationRange[0], newMinutes), newMinutes]);
                              }}
                              className="w-16 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                            />
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Multiplier range slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium flex items-center">
                    View Multiplier: {viewMultiplierRange[0] < 10 ? viewMultiplierRange[0].toFixed(1) : viewMultiplierRange[0].toFixed(0)}x - {viewMultiplierRange[1] < 10 ? viewMultiplierRange[1].toFixed(1) : viewMultiplierRange[1].toFixed(0)}x
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
                    
                    {/* Min Multiplier Slider */}
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Min:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500" 
                        step="0.5" 
                        value={viewMultiplierRange[0]}
                        onChange={handleViewMultiplierMinChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Max Multiplier Slider */}
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">Max:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="500" 
                        step="0.5" 
                        value={viewMultiplierRange[1]}
                        onChange={handleViewMultiplierMaxChange}
                        className="slider-track flex-grow"
                      />
                    </div>
                    
                    {/* Input field for direct value entry */}
                    <div className="flex items-center mt-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mr-2">Custom range:</label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max={viewMultiplierRange[1]}
                          step="0.1"
                          value={viewMultiplierRange[0]}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setViewMultiplierRange([value, Math.max(value, viewMultiplierRange[1])]);
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                        />
                        <span className="ml-1 mr-2 text-xs text-gray-500 dark:text-gray-400">x</span>
                        <span className="mx-2">to</span>
                        <input
                          type="number"
                          min={viewMultiplierRange[0]}
                          max="500"
                          step="0.1"
                          value={viewMultiplierRange[1]}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              setViewMultiplierRange([Math.min(viewMultiplierRange[0], value), value]);
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
                        />
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">x</span>
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
                        <button 
                          onClick={() => setDateRange([
                            new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          Last 180 days
                        </button>
                        <button 
                          onClick={() => setDateRange([
                            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          Last 365 days
                        </button>
                        <button 
                          onClick={() => setDateRange([
                            "2010-01-01", // YouTube started in 2005, but using 2010 as a reasonable "all time" starting point
                            new Date().toISOString().split('T')[0]
                          ])}
                          className="bg-white dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        >
                          All time
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Advanced Filters Toggle */}
            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                className="flex items-center justify-between w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium">Advanced Filters</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${isAdvancedFiltersOpen ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Advanced Filters Section */}
            {isAdvancedFiltersOpen && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg animate-fadeIn">
                {/* Channel Age */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Channel Age: {channelAgeRange[0] < 12 ? `${channelAgeRange[0]} months` : `${Math.floor(channelAgeRange[0]/12)} years ${channelAgeRange[0]%12 ? `${channelAgeRange[0]%12} months` : ''}`} - {channelAgeRange[1] < 12 ? `${channelAgeRange[1]} months` : `${Math.floor(channelAgeRange[1]/12)} years ${channelAgeRange[1]%12 ? `${channelAgeRange[1]%12} months` : ''}`}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>5+ years</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="120" 
                      step={getChannelAgeStep(channelAgeRange[1])}
                      value={channelAgeRange[0]}
                      onChange={handleChannelAgeMinChange}
                      className="slider-track mb-2"
                    />
                    <input 
                      type="range" 
                      min="0" 
                      max="200000" 
                      step={getVideoCommentsStep()}
                      value={videoCommentsThreshold}
                      onChange={handleVideoCommentsChange}
                      className="slider-track mb-2"
                    />
                  </div>
                </div>

                {/* Video Likes */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Video Likes: {formatNumber(videoLikesThreshold)}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>1M+</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000000" 
                      step={getVideoLikesStep()}
                      value={videoLikesThreshold}
                      onChange={handleVideoLikesChange}
                      className="slider-track mb-2"
                    />
                  </div>
                </div>

                {/* Video Count */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Video Count: {videoCountThreshold}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>1000+</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      step={getVideoCountStep()}
                      value={videoCountThreshold}
                      onChange={handleVideoCountChange}
                      className="slider-track mb-2"
                    />
                  </div>
                </div>

                {/* Total Channel Views */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Total Channel Views: {formatNumber(totalChannelViewsThreshold)}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>1B+</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1000000000" 
                      step={getTotalChannelViewsStep()}
                      value={totalChannelViewsThreshold}
                      onChange={handleTotalChannelViewsChange}
                      className="slider-track mb-2"
                    />
                  </div>
                </div>

                {/* Keywords section - spans both columns */}
                <div className="col-span-1 lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Include Keywords */}
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                        Include Keywords
                      </label>
                      <input 
                        type="text" 
                        placeholder="gaming, tutorial, review"
                        value={includeKeywords}
                        onChange={(e) => setIncludeKeywords(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate keywords with commas</p>
                    </div>
                    
                    {/* Exclude Keywords */}
                    <div>
                      <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                        Exclude Keywords
                      </label>
                      <input 
                        type="text" 
                        placeholder="unboxing, shorts, live"
                        value={excludeKeywords}
                        onChange={(e) => setExcludeKeywords(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate keywords with commas</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
      </div>

      {/* Similar Videos Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FaYoutube className="text-red-500" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Related Videos</h2>
            <div className="text-gray-400 dark:text-gray-500 cursor-help" title="Videos from competitive channels and similar content">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Video Selection Tabs */}
        <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeVideoTab === 'competitors' 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveVideoTab('competitors')}
          >
            Competitor Videos
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeVideoTab === 'similar' 
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveVideoTab('similar')}
          >
            Similar Content
          </button>
          
          {/* Filter Status Indicator */}
          {isFilterActive && (
            <div className="ml-auto flex items-center px-3">
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                {filteredCompetitorIds.length} channels filtered
              </span>
            </div>
          )}
        </div>
        
        {/* Combined Search and Grid Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="relative">
              <button 
                className={`bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-xl text-gray-700 dark:text-gray-300 mr-2 ${isFilterActive ? 'ring-2 ring-indigo-500' : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                title={isFilterActive ? "Filters active - click to modify" : "Filter videos"}
              >
                <FaFilter size={18} className={isFilterActive ? "text-indigo-500" : ""} />
              </button>
              {isFilterActive && (
                <span className="absolute -top-2 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {filteredCompetitorIds.length}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search related videos"
                value={videoSearchQuery}
                onChange={(e) => setVideoSearchQuery(e.target.value)}
                className="w-60 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {videoSearchQuery && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setVideoSearchQuery('')}
                  title="Clear search"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>
            {isFilterActive && (
              <button
                className="ml-2 text-sm text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                onClick={resetFilter}
              >
                Reset filters
              </button>
            )}
          </div>
          
          {/* Grid Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Videos per row:</span>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl">
                {[1, 2, 3, 4, 5, 6].map((columns) => (
                  <button 
                    key={columns}
                    className={`px-2 py-1 text-sm ${videoGridColumns === columns ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    onClick={() => handleVideoGridColumnsChange(columns)}
                  >
                    {columns}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm"
              onClick={toggleVideoInfo}
              title={showVideoInfo ? "Hide video info" : "Show video info"}
            >
              {showVideoInfo ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              <span className="hidden sm:inline">{showVideoInfo ? "Hide info" : "Show info"}</span>
            </button>
          </div>
        </div>

        {/* Video Grid */}
        {isVideoLoading ? (
          <div className="w-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-gray-600 dark:text-gray-400">Loading videos...</p>
          </div>
        ) : activeVideoTab === 'competitors' && getVideosByChannel().length > 0 ? (
          <div className="space-y-8">
            {getVideosByChannel().map((group) => (
              <div key={group.channel?.youtubeId || 'unknown'} className="mb-8">
                {/* Channel header */}
                <div className="flex items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {group.channel && (
                    <>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3">
                        <img 
                          src={group.channel.thumbnailUrl} 
                          alt={group.channel.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <a 
                          href={`https://youtube.com/channel/${group.channel.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-lg text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                        >
                          {group.channel.name}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Latest {group.videos.length} videos
                        </p>
                      </div>
                    </>
                  )}
                  {!group.channel && (
                    <div className="font-medium text-lg text-gray-700 dark:text-gray-300">
                      Unknown Channel
                    </div>
                  )}
                </div>
                
                {/* Channel videos grid */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${videoGridColumns}, minmax(0, 1fr))` }}>
                  {group.videos.map((video) => (
                    <div 
                      key={video.id} 
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                      onClick={() => openVideoOnYouTube(video.youtubeId)}
                      onContextMenu={(e) => handleVideoContextMenu(e, video.youtubeId)}
                    >
                      <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title} 
                          className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <FaPlay className="text-white text-4xl" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {showVideoInfo && (
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 flex-1">{video.title}</h3>
                            <FaExternalLinkAlt size={12} className="text-gray-400 dark:text-gray-500 mt-1 ml-2 flex-shrink-0" />
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                              {formatNumber(video.viewCount)} views
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                              {formatNumber(video.likeCount)} likes
                            </span>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-xl px-2 py-1 font-medium">
                              {video.vph} VPH
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeVideoTab === 'similar' && filteredVideos.length > 0 ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${videoGridColumns}, minmax(0, 1fr))` }}>
            {filteredVideos.map((video) => (
              <div 
                key={video.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                onClick={() => openVideoOnYouTube(video.youtubeId)}
                onContextMenu={(e) => handleVideoContextMenu(e, video.youtubeId)}
              >
                <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FaPlay className="text-white text-4xl" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {showVideoInfo && (
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 flex-1">{video.title}</h3>
                      <FaExternalLinkAlt size={12} className="text-gray-400 dark:text-gray-500 mt-1 ml-2 flex-shrink-0" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                        {formatNumber(video.viewCount)} views
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl px-2 py-1">
                        {formatNumber(video.likeCount)} likes
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-xl px-2 py-1 font-medium">
                        {video.vph} VPH
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {videoSearchQuery 
                ? "No videos found matching your search." 
                : activeVideoTab === 'competitors'
                  ? competitors.length > 0
                    ? "No videos found for your tracked competitors."
                    : "Videos from your tracked competitors will appear here. Add competitors to the Tracked Channels section above."
                  : "Similar content videos are not available at this time."}
            </p>
            {videoSearchQuery && (
              <button
                onClick={() => setVideoSearchQuery('')}
                className="text-indigo-600 dark:text-indigo-400 underline"
              >
                Clear search
              </button>
            )}
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
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 relative"
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
                <label htmlFor="channelSearch" className="block text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Search for a YouTube Channel:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="channelSearch"
                    value={channelSearchQuery}
                    onChange={(e) => setChannelSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter channel name..."
                    autoFocus
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  
                  {channelSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                      <ul className="max-h-60 overflow-y-auto">
                        {channelSearchResults.map((channel) => (
                          <li 
                            key={channel.id}
                            onClick={() => selectChannel(channel)}
                            className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                          >
                            <img 
                              src={channel.thumbnailUrl} 
                              alt={channel.title} 
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <p className="font-medium dark:text-white">{channel.title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{channel.description}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Search for a YouTube channel by name to find and track competitors
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="youtubeId" className="block text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Or enter YouTube Channel ID directly:
                </label>
                <input 
                  type="text"
                  id="youtubeId"
                  value={newCompetitorId}
                  onChange={handleChannelIdChange}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Channel ID is in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
                </p>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4 rounded-r-xl">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-4 py-2 rounded-xl mr-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isAdding || (!newCompetitorId.trim() && !channelSearchQuery.trim())}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Video Context Menu */}
      {showVideoContextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-2 z-50"
          style={{ 
            top: `${contextMenuPosition.y}px`, 
            left: `${contextMenuPosition.x}px`,
            minWidth: '180px'
          }}
        >
          <div className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-1">
            Video Options
          </div>
          
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            onClick={() => {
              if (selectedVideoId) openVideoOnYouTube(selectedVideoId);
              setShowVideoContextMenu(false);
            }}
          >
            <FaExternalLinkAlt size={14} />
            Open in YouTube
          </button>
          
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            onClick={() => {
              alert('Feature not yet implemented');
              setShowVideoContextMenu(false);
            }}
          >
            <FaBookmark size={14} />
            Save for later
          </button>
          
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            onClick={() => {
              alert('Feature not yet implemented');
              setShowVideoContextMenu(false);
            }}
          >
            <FaClipboard size={14} />
            Copy link
          </button>
          
          <button 
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            onClick={() => {
              alert('Feature not yet implemented');
              setShowVideoContextMenu(false);
            }}
          >
            <FaChartLine size={14} />
            Analyze performance
          </button>
        </div>
      )}
    </div>
  );
}