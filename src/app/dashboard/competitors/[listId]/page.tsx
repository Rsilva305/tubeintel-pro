'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTimes, FaYoutube, FaEllipsisV, FaChartBar, FaDownload, FaFilter, FaChevronDown, FaStar, FaRocket, FaTrophy, FaCheck, FaCalendarAlt, FaEye, FaEyeSlash, FaThLarge, FaSearch, FaExternalLinkAlt, FaPlay, FaBookmark, FaClipboard, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';
import { Competitor, Video } from '@/types';
import { competitorsApi, videosApi } from '@/services/api';
import { getUseRealApi } from '@/services/api/config';
import { competitorListsApi } from '@/services/api/competitorLists';

// Mock suggested competitors for demo - Expanded to 10+ competitors
const suggestedCompetitors = [
  { id: 'sugg1', name: 'TechReviewer', thumbnailUrl: 'https://via.placeholder.com/150?text=TR', subscriberCount: 208000, videoCount: 342, viewCount: 15600000, youtubeId: 'UCTR123456789' },
  { id: 'sugg2', name: 'GamingDaily', thumbnailUrl: 'https://via.placeholder.com/150?text=GD', subscriberCount: 620000, videoCount: 527, viewCount: 48000000, youtubeId: 'UCGD987654321' },
  { id: 'sugg3', name: 'FoodChannel', thumbnailUrl: 'https://via.placeholder.com/150?text=FC', subscriberCount: 779000, videoCount: 623, viewCount: 53000000, youtubeId: 'UCFC456789123' },
  { id: 'sugg4', name: 'TravelVlog', thumbnailUrl: 'https://via.placeholder.com/150?text=TV', subscriberCount: 318000, videoCount: 287, viewCount: 22000000, youtubeId: 'UCTV789123456' },
  { id: 'sugg5', name: 'MusicMasters', thumbnailUrl: 'https://via.placeholder.com/150?text=MM', subscriberCount: 1250000, videoCount: 412, viewCount: 89000000, youtubeId: 'UCMM567890123' },
  { id: 'sugg6', name: 'DIYCreator', thumbnailUrl: 'https://via.placeholder.com/150?text=DIY', subscriberCount: 435000, videoCount: 328, viewCount: 31000000, youtubeId: 'UCDIY12345678' },
  { id: 'sugg7', name: 'ScienceExplorer', thumbnailUrl: 'https://via.placeholder.com/150?text=SCI', subscriberCount: 890000, videoCount: 275, viewCount: 65000000, youtubeId: 'UCSCI87654321' },
  { id: 'sugg8', name: 'FitnessPro', thumbnailUrl: 'https://via.placeholder.com/150?text=FIT', subscriberCount: 520000, videoCount: 380, viewCount: 42000000, youtubeId: 'UCFIT12345678' },
  { id: 'sugg9', name: 'BeautyTips', thumbnailUrl: 'https://via.placeholder.com/150?text=BTY', subscriberCount: 1800000, videoCount: 520, viewCount: 112000000, youtubeId: 'UCBTY98765432' },
  { id: 'sugg10', name: 'CookingExpert', thumbnailUrl: 'https://via.placeholder.com/150?text=CKG', subscriberCount: 670000, videoCount: 430, viewCount: 58000000, youtubeId: 'UCCK765432109' }
];

// Mock similar videos for demo that would come from competitor channels
const mockCompetitorVideos: Video[] = [
  {
    id: 'video1',
    youtubeId: 'dQw4w9WgXcQ',
    channelId: 'UCTR123456789',
    title: 'How to Grow Your YouTube Channel in 2023',
    description: 'Learn the latest strategies for growing your YouTube channel',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=YouTube+Growth',
    publishedAt: new Date('2023-06-15'),
    viewCount: 125000,
    likeCount: 8500,
    commentCount: 650,
    vph: 180,
  },
  {
    id: 'video2',
    youtubeId: 'oHg5SJYRHA0',
    channelId: 'UCGD987654321',
    title: 'Top 10 Video Editing Mistakes to Avoid',
    description: 'Avoiding these common mistakes will drastically improve your videos',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Editing+Tips',
    publishedAt: new Date('2023-05-20'),
    viewCount: 98000,
    likeCount: 7200,
    commentCount: 520,
    vph: 150,
  },
  {
    id: 'video3',
    youtubeId: 'y8Yv4pnO7qc',
    channelId: 'UCFC456789123',
    title: 'Best Camera Settings for YouTube',
    description: 'Optimize your camera settings for professional-looking YouTube videos',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Camera+Settings',
    publishedAt: new Date('2023-07-01'),
    viewCount: 72000,
    likeCount: 5100,
    commentCount: 380,
    vph: 130,
  },
  {
    id: 'video4',
    youtubeId: 'z9bZufPHFLU',
    channelId: 'UCTV789123456',
    title: 'YouTube Algorithm: What Changed in 2023',
    description: 'Understanding the latest YouTube algorithm changes',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Algorithm+Updates',
    publishedAt: new Date('2023-06-25'),
    viewCount: 85000,
    likeCount: 6300,
    commentCount: 470,
    vph: 140,
  },
  {
    id: 'video5',
    youtubeId: 'lGEmnVX9TNc',
    channelId: 'UCTR123456789',
    title: 'How to Research Video Topics that Get Views',
    description: 'Find winning video topics that will bring in views and subscribers',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Topic+Research',
    publishedAt: new Date('2023-07-10'),
    viewCount: 62000,
    likeCount: 4800,
    commentCount: 350,
    vph: 120,
  },
  {
    id: 'video6',
    youtubeId: 'k1BneeJTDcU',
    channelId: 'UCGD987654321',
    title: 'Thumbnail Design That Gets Clicks',
    description: 'Create thumbnails that attract viewers and increase CTR',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Thumbnail+Design',
    publishedAt: new Date('2023-06-05'),
    viewCount: 105000,
    likeCount: 7800,
    commentCount: 590,
    vph: 160,
  },
];

// Mock similar videos based on keywords
const mockSimilarVideos: Video[] = [
  {
    id: 'video7',
    youtubeId: 'dQw4w9WgXcQ',
    channelId: 'UCnew123456',
    title: '5 Ways to Improve Video Retention',
    description: 'Techniques to keep viewers watching your videos longer',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Video+Retention',
    publishedAt: new Date('2023-05-10'),
    viewCount: 88000,
    likeCount: 6500,
    commentCount: 480,
    vph: 145,
  },
  {
    id: 'video8',
    youtubeId: 'oHg5SJYRHA0',
    channelId: 'UCnew789123',
    title: 'Best Time to Upload on YouTube',
    description: 'Find the optimal upload schedule for maximum views',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Upload+Timing',
    publishedAt: new Date('2023-07-05'),
    viewCount: 75000,
    likeCount: 5500,
    commentCount: 410,
    vph: 135,
  },
  {
    id: 'video9',
    youtubeId: 'abCD123456',
    channelId: 'UCnew456789',
    title: 'How to Optimize YouTube SEO',
    description: 'Improve your video rankings with these SEO tips',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=YouTube+SEO',
    publishedAt: new Date('2023-04-15'),
    viewCount: 112000,
    likeCount: 8200,
    commentCount: 570,
    vph: 155,
  },
  {
    id: 'video10',
    youtubeId: 'efGH789012',
    channelId: 'UCnew234567',
    title: 'The Perfect YouTube Studio Setup',
    description: 'Create a professional studio on any budget',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Studio+Setup',
    publishedAt: new Date('2023-06-20'),
    viewCount: 95000,
    likeCount: 7100,
    commentCount: 490,
    vph: 148,
  },
  {
    id: 'video11',
    youtubeId: 'ijKL345678',
    channelId: 'UCnew567890',
    title: 'YouTube Analytics Explained',
    description: 'Understanding your channel metrics for growth',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Analytics',
    publishedAt: new Date('2023-05-05'),
    viewCount: 82000,
    likeCount: 6000,
    commentCount: 420,
    vph: 138,
  },
  {
    id: 'video12',
    youtubeId: 'mnoP901234',
    channelId: 'UCnew345678',
    title: 'Creating Better YouTube Titles',
    description: 'Write titles that attract viewers and boost CTR',
    thumbnailUrl: 'https://via.placeholder.com/320x180?text=Better+Titles',
    publishedAt: new Date('2023-07-15'),
    viewCount: 68000,
    likeCount: 5000,
    commentCount: 360,
    vph: 125,
  },
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

  // State for advanced filters
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState<boolean>(false);
  const [channelAgeThreshold, setChannelAgeThreshold] = useState<number>(12); // Default to 12 months
  const [videoCommentsThreshold, setVideoCommentsThreshold] = useState<number>(1000);
  const [videoLikesThreshold, setVideoLikesThreshold] = useState<number>(5000);
  const [videoCountThreshold, setVideoCountThreshold] = useState<number>(50);
  const [totalChannelViewsThreshold, setTotalChannelViewsThreshold] = useState<number>(1000000);
  const [includeKeywords, setIncludeKeywords] = useState<string>("");
  const [excludeKeywords, setExcludeKeywords] = useState<string>("");

  // Add new state variables for similar videos section
  const [competitorVideos, setCompetitorVideos] = useState<Video[]>([]);
  const [similarVideos, setSimilarVideos] = useState<Video[]>([]);
  const [videoGridColumns, setVideoGridColumns] = useState<number>(3);
  const [showVideoInfo, setShowVideoInfo] = useState<boolean>(true);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>('');
  const [activeVideoTab, setActiveVideoTab] = useState<'competitors' | 'similar'>('competitors');
  const [showSuggestedCompetitors, setShowSuggestedCompetitors] = useState<boolean>(false);
  const competitorCarouselRef = useRef<HTMLDivElement>(null);
  
  // Add states for the video context menu
  const [showVideoContextMenu, setShowVideoContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // State for filter settings
  const [minSubscribers, setMinSubscribers] = useState<number>(0);

  // Call the check on mount
  useEffect(() => {
    fetchCompetitors();
    
    // Simulate API call for videos
    setTimeout(() => {
      setCompetitorVideos(mockCompetitorVideos);
      setSimilarVideos(mockSimilarVideos);
      setIsLoading(false);
    }, 1000);
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
        const formattedCompetitors = competitors.map(c => ({
          id: c.id,
          youtubeId: c.youtubeId,
          name: c.name,
          thumbnailUrl: c.thumbnailUrl || '',
          subscriberCount: c.subscriberCount || 0,
          videoCount: c.videoCount || 0,
          viewCount: c.viewCount || 0
        }));
        
        setCompetitors(formattedCompetitors);
      } catch (error) {
        console.error('Error fetching competitors for list:', error);
        if (error instanceof Error && error.message.includes('not found')) {
          // List not found, redirect to the main competitors page
          router.push('/dashboard/competitors');
        }
      }
      
      // Simulate API call for videos
      setTimeout(() => {
        setCompetitorVideos(mockCompetitorVideos);
        setSimilarVideos(mockSimilarVideos);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error in fetchCompetitors:', error);
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
      
      // Create a sample video for this competitor to show in the Related Videos section
      const newVideo: Video = {
        id: `video-${Date.now()}`,
        youtubeId: `v-${Date.now()}`,
        channelId: competitor.youtubeId,
        title: `Latest video from ${competitor.name}`,
        description: 'This channel was just added to your tracked competitors',
        thumbnailUrl: 'https://via.placeholder.com/320x180?text=New+Channel+Video',
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 50000) + 5000,
        likeCount: Math.floor(Math.random() * 5000) + 500,
        commentCount: Math.floor(Math.random() * 300) + 50,
        vph: Math.floor(Math.random() * 100) + 20
      };
      
      // Add this video to the competitor videos array
      setCompetitorVideos(prev => [newVideo, ...prev]);
      
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
      
      // Remove the competitor from the database/API
      await competitorsApi.removeCompetitor(id);
      
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
    
    // Reset advanced filters
    setChannelAgeThreshold(12);
    setVideoCommentsThreshold(1000);
    setVideoLikesThreshold(5000);
    setVideoCountThreshold(50);
    setTotalChannelViewsThreshold(1000000);
    setIncludeKeywords("");
    setExcludeKeywords("");
  }

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

  // Views slider step function - dynamic based on position
  const getViewsStep = (): number => {
    const maxViews = 500000000;
    if (viewsThreshold < 1000000) return 50000;       // 0-1M: steps of 50K
    if (viewsThreshold < 10000000) return 500000;     // 1M-10M: steps of 500K
    if (viewsThreshold < 50000000) return 1000000;    // 10M-50M: steps of 1M
    if (viewsThreshold < 100000000) return 5000000;   // 50M-100M: steps of 5M
    return 10000000;                                  // 100M+: steps of 10M
  };

  // Subscribers slider step function
  const getSubscribersStep = (): number => {
    const maxSubs = 500000000;
    if (subscribersThreshold < 100000) return 5000;       // 0-100K: steps of 5K
    if (subscribersThreshold < 1000000) return 50000;     // 100K-1M: steps of 50K
    if (subscribersThreshold < 10000000) return 500000;   // 1M-10M: steps of 500K
    if (subscribersThreshold < 100000000) return 5000000; // 10M-100M: steps of 5M
    return 10000000;                                      // 100M+: steps of 10M
  };

  // Video duration step function
  const getVideoDurationStep = (): number => {
    if (videoDurationThreshold < 60) return 1;         // 0-1hr: steps of 1 minute
    if (videoDurationThreshold < 180) return 5;        // 1-3hrs: steps of 5 minutes
    if (videoDurationThreshold < 360) return 10;       // 3-6hrs: steps of 10 minutes
    if (videoDurationThreshold < 720) return 30;       // 6-12hrs: steps of 30 minutes
    return 60;                                         // 12hr+: steps of 60 minutes (1 hour)
  };

  // View multiplier step function
  const getViewMultiplierStep = (): number => {
    if (viewMultiplierThreshold < 5) return 0.1;       // 0-5x: steps of 0.1
    if (viewMultiplierThreshold < 20) return 0.5;      // 5-20x: steps of 0.5
    if (viewMultiplierThreshold < 100) return 1;       // 20-100x: steps of 1
    if (viewMultiplierThreshold < 200) return 5;       // 100-200x: steps of 5
    return 10;                                         // 200x+: steps of 10
  };

  // Views slider input change
  const handleViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setViewsThreshold(value);
    }
  };

  // Subscribers slider input change
  const handleSubscribersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setSubscribersThreshold(value);
    }
  };

  // Video duration slider input change
  const handleVideoDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoDurationThreshold(value);
    }
  };

  // View multiplier slider input change
  const handleViewMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setViewMultiplierThreshold(value);
    }
  };

  // Update existing handler for views
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

  // Channel age step function
  const getChannelAgeStep = (): number => {
    if (channelAgeThreshold < 12) return 1;        // 0-12 months: steps of 1 month
    if (channelAgeThreshold < 36) return 3;        // 1-3 years: steps of 3 months
    if (channelAgeThreshold < 60) return 6;        // 3-5 years: steps of 6 months
    return 12;                                     // 5+ years: steps of 1 year
  };

  // Video comments step function
  const getVideoCommentsStep = (): number => {
    if (videoCommentsThreshold < 1000) return 50;
    if (videoCommentsThreshold < 10000) return 500;
    if (videoCommentsThreshold < 100000) return 5000;
    return 10000;
  };

  // Video likes step function
  const getVideoLikesStep = (): number => {
    if (videoLikesThreshold < 1000) return 100;
    if (videoLikesThreshold < 10000) return 500;
    if (videoLikesThreshold < 100000) return 5000;
    return 10000;
  };

  // Video count step function
  const getVideoCountStep = (): number => {
    if (videoCountThreshold < 100) return 5;
    if (videoCountThreshold < 500) return 25;
    if (videoCountThreshold < 1000) return 50;
    return 100;
  };

  // Total channel views step function
  const getTotalChannelViewsStep = (): number => {
    if (totalChannelViewsThreshold < 1000000) return 100000;
    if (totalChannelViewsThreshold < 10000000) return 500000;
    if (totalChannelViewsThreshold < 100000000) return 5000000;
    return 10000000;
  };

  // Handler functions for advanced filters
  const handleChannelAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setChannelAgeThreshold(value);
    }
  };

  const handleVideoCommentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCommentsThreshold(value);
    }
  };

  const handleVideoLikesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoLikesThreshold(value);
    }
  };

  const handleVideoCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setVideoCountThreshold(value);
    }
  };

  const handleTotalChannelViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTotalChannelViewsThreshold(value);
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

  // Filter videos based on search query
  const filteredVideos = activeVideoTab === 'competitors' 
    ? competitorVideos.filter(video => 
        video.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
        video.description.toLowerCase().includes(videoSearchQuery.toLowerCase())
      )
    : similarVideos.filter(video => 
        video.title.toLowerCase().includes(videoSearchQuery.toLowerCase()) || 
        video.description.toLowerCase().includes(videoSearchQuery.toLowerCase())
      );

  // Function to scroll competitor carousel
  const scrollCompetitorCarousel = (direction: 'left' | 'right') => {
    if (competitorCarouselRef.current) {
      const scrollAmount = 300; // px to scroll
      const currentScroll = competitorCarouselRef.current.scrollLeft;
      
      competitorCarouselRef.current.scrollTo({
        left: direction === 'left' 
          ? Math.max(currentScroll - scrollAmount, 0) 
          : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">{competitor.youtubeId}</p>
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

      {/* Suggested competitors - Now with toggle and more options */}
      {showSuggestedCompetitors && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FaChartBar className="text-indigo-500" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Suggested competitors</h2>
              <div className="text-gray-400 dark:text-gray-500 cursor-help" title="Channels similar to your current competitors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <button 
              onClick={() => setShowSuggestedCompetitors(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              title="Hide suggested competitors"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Competitor Carousel with scroll indicators */}
          <div className="relative">
            <div 
              ref={competitorCarouselRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 pb-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="flex gap-8 pb-8 px-2" style={{ width: 'max-content', minWidth: '100%' }}>
                {suggestedCompetitors.map((competitor) => (
                  <div key={competitor.id} className="flex-shrink-0 flex flex-col items-center text-center" style={{ minWidth: '120px' }}>
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-gray-100 dark:ring-gray-800 shadow-md hover:shadow-lg transition-all duration-200">
                        <img 
                          src={competitor.thumbnailUrl}
                          alt={competitor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm">
                        {getCompetitorIcon(competitor)}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-200">
                        <button 
                          className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-700"
                          onClick={() => {
                            // In a real implementation, we would add this competitor
                            alert(`Would add ${competitor.name} to your tracked competitors`);
                          }}
                        >
                          <FaPlus size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-gray-800 dark:text-white font-medium text-base mt-4 max-w-[120px] truncate">{competitor.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{formatNumber(competitor.subscriberCount)} subs</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scroll indicators with click handlers */}
            <div 
              onClick={() => scrollCompetitorCarousel('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-700 shadow-md rounded-full flex items-center justify-center z-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div 
              onClick={() => scrollCompetitorCarousel('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-700 shadow-md rounded-full flex items-center justify-center z-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
      
      {/* Show button to restore suggested competitors when hidden */}
      {!showSuggestedCompetitors && (
        <button 
          onClick={() => setShowSuggestedCompetitors(true)} 
          className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3 mb-6 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FaChartBar className="text-indigo-500" />
          <span>Show suggested competitors</span>
        </button>
      )}

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
            
            <div className="grid grid-cols-3 gap-8">
              {/* Left column with sliders */}
              <div className="col-span-2 space-y-8">
                {/* Views slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Views: {formatNumber(viewsThreshold)}
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
                      step={getViewsStep()}
                      value={viewsThreshold}
                      onChange={handleViewsChange}
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
                
                {/* Subscribers slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Subscribers: {formatNumber(subscribersThreshold)}
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
                      step={getSubscribersStep()}
                      value={subscribersThreshold}
                      onChange={handleSubscribersChange}
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
                
                {/* Video Duration slider */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Video Duration: {Math.floor(videoDurationThreshold / 60)}h {videoDurationThreshold % 60}m
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
                      step={getVideoDurationStep()}
                      value={videoDurationThreshold}
                      onChange={handleVideoDurationChange}
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
                      step={getViewMultiplierStep()}
                      value={viewMultiplierThreshold}
                      onChange={handleViewMultiplierChange}
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
                    Channel Age: {channelAgeThreshold < 12 ? `${channelAgeThreshold} months` : `${Math.floor(channelAgeThreshold/12)} years ${channelAgeThreshold%12 ? `${channelAgeThreshold%12} months` : ''}`}
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
                      step={getChannelAgeStep()}
                      value={channelAgeThreshold}
                      onChange={handleChannelAgeChange}
                      className="slider-track mb-2"
                    />
                  </div>
                </div>

                {/* Video Comments */}
                <div>
                  <label className="block text-gray-600 dark:text-gray-300 text-sm mb-2 font-medium">
                    Video Comments: {formatNumber(videoCommentsThreshold)}
                  </label>
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>0</span>
                      <span>100K+</span>
                    </div>
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
        </div>
        
        {/* Combined Search and Grid Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button 
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-xl text-gray-700 dark:text-gray-300 mr-2"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FaFilter size={18} />
            </button>
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
            </div>
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
        {filteredVideos.length > 0 ? (
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
                : "Videos from your tracked competitors will appear here. Add competitors to the Tracked Channels section above."}
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
                <label htmlFor="youtubeId" className="block text-gray-600 dark:text-gray-300 text-sm mb-2">
                  YouTube Channel ID
                </label>
                <input 
                  type="text"
                  id="youtubeId"
                  value={newCompetitorId}
                  onChange={(e) => setNewCompetitorId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                  autoFocus
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Find a channel ID by going to the channel's page and looking at the URL. 
                  It's usually in the format 'UC_x5XG1OV2P6uZZ5FSM9Ttw'.
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
                  disabled={isAdding || !newCompetitorId.trim()}
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