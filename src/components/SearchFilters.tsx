'use client';

import React, { useState } from 'react';
import { FaTimes, FaInfoCircle, FaChevronDown } from 'react-icons/fa';

type SearchPrecision = 'Specific' | 'Hybrid';
type ContentFormat = 'Videos' | 'Shorts';
type TimeRange = '30 Days' | '90 Days' | '180 Days' | '365 Days' | '3 Years' | 'All Time' | 'Custom';

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onReset: () => void;
  onSavePreset?: (name: string) => void;
}

export default function SearchFilters({
  isOpen,
  onClose,
  onApply,
  onReset,
  onSavePreset
}: SearchFiltersProps) {
  // Search precision state
  const [searchPrecision, setSearchPrecision] = useState<SearchPrecision>('Hybrid');
  
  // Content format state
  const [contentFormat, setContentFormat] = useState<ContentFormat>('Videos');
  
  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>('All Time');
  const [startDate, setStartDate] = useState('Feb 13, 2005');
  const [endDate, setEndDate] = useState('May 9, 2025');
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2023');
  
  // Range sliders state
  const [multiplierMin, setMultiplierMin] = useState('0.0x');
  const [multiplierMax, setMultiplierMax] = useState('500.0x+');
  const [viewsMin, setViewsMin] = useState('0');
  const [viewsMax, setViewsMax] = useState('1B+');
  const [subscribersMin, setSubscribersMin] = useState('0');
  const [subscribersMax, setSubscribersMax] = useState('500M+');
  const [videoDurationMin, setVideoDurationMin] = useState('00:00:00');
  const [videoDurationMax, setVideoDurationMax] = useState('07:00:00+');
  
  // When posted checkbox
  const [whenPosted, setWhenPosted] = useState(false);
  
  // Advanced filters state
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [viewsToSubsRatioMin, setViewsToSubsRatioMin] = useState('0.0');
  const [viewsToSubsRatioMax, setViewsToSubsRatioMax] = useState('500.0+');
  const [medianViewsMin, setMedianViewsMin] = useState('0');
  const [medianViewsMax, setMedianViewsMax] = useState('400M+');
  const [channelTotalViewsMin, setChannelTotalViewsMin] = useState('0');
  const [channelTotalViewsMax, setChannelTotalViewsMax] = useState('100B+');
  const [channelVideoCountMin, setChannelVideoCountMin] = useState('0');
  const [channelVideoCountMax, setChannelVideoCountMax] = useState('100k+');
  const [videoLikesMin, setVideoLikesMin] = useState('0');
  const [videoLikesMax, setVideoLikesMax] = useState('50M+');
  const [videoCommentsMin, setVideoCommentsMin] = useState('0');
  const [videoCommentsMax, setVideoCommentsMax] = useState('5M+');
  const [engagementRateMin, setEngagementRateMin] = useState('0');
  const [engagementRateMax, setEngagementRateMax] = useState('100+');
  const [channelAgeMin, setChannelAgeMin] = useState('Brand new');
  const [channelAgeMax, setChannelAgeMax] = useState('20 years ago+');
  const [includeChannels, setIncludeChannels] = useState('');
  const [excludeChannels, setExcludeChannels] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  
  const handleTimeRangeSelect = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleApply = () => {
    const filters = {
      searchPrecision,
      contentFormat,
      timeRange,
      startDate,
      endDate,
      multiplierMin,
      multiplierMax,
      viewsMin,
      viewsMax,
      subscribersMin,
      subscribersMax,
      videoDurationMin,
      videoDurationMax,
      whenPosted,
      advancedFilters: {
        viewsToSubsRatioMin,
        viewsToSubsRatioMax,
        medianViewsMin,
        medianViewsMax,
        channelTotalViewsMin,
        channelTotalViewsMax,
        channelVideoCountMin,
        channelVideoCountMax,
        videoLikesMin,
        videoLikesMax,
        videoCommentsMin,
        videoCommentsMax,
        engagementRateMin,
        engagementRateMax,
        channelAgeMin,
        channelAgeMax,
        includeChannels,
        excludeChannels,
        includeKeywords,
        excludeKeywords
      }
    };
    
    onApply(filters);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30" 
        onClick={onClose}
      ></div>
      <div className="bg-black rounded-lg w-[1200px] relative text-white p-5 mx-4 my-4 z-10 max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </button>
        
        {/* Header */}
        <h2 className="text-2xl font-normal mb-3">Search filters</h2>
        
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          {/* LEFT COLUMN - All slider options */}
          <div>
            {/* Search precision and Content format in one row */}
            <div className="flex mb-3 gap-5">
              {/* Search precision */}
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Search precision</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="flex bg-zinc-900 rounded-full p-1 w-fit">
                  <button
                    className={`px-4 py-1 rounded-full text-xs ${
                      searchPrecision === 'Specific' ? 'bg-red-600 text-white' : 'text-white'
                    }`}
                    onClick={() => setSearchPrecision('Specific')}
                  >
                    Specific
                  </button>
                  <button
                    className={`px-4 py-1 rounded-full text-xs ${
                      searchPrecision === 'Hybrid' ? 'bg-red-600 text-white' : 'text-white'
                    }`}
                    onClick={() => setSearchPrecision('Hybrid')}
                  >
                    Hybrid
                  </button>
                </div>
              </div>
              
              {/* Content format */}
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Content format</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="flex bg-zinc-900 rounded-full p-1 w-fit">
                  <button
                    className={`px-4 py-1 rounded-full text-xs flex items-center ${
                      contentFormat === 'Videos' ? 'bg-red-600 text-white' : 'text-white'
                    }`}
                    onClick={() => setContentFormat('Videos')}
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                    </svg>
                    Videos
                  </button>
                  <button
                    className={`px-4 py-1 rounded-full text-xs flex items-center ${
                      contentFormat === 'Shorts' ? 'bg-red-600 text-white' : 'text-white'
                    }`}
                    onClick={() => setContentFormat('Shorts')}
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    Shorts
                  </button>
                </div>
              </div>
            </div>
            
            {/* Multiplier */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-normal">Multiplier</h3>
                <div className="ml-2 text-gray-400 cursor-help">
                  <FaInfoCircle size={12} />
                </div>
              </div>
              <div className="mb-1">
                <input
                  type="range"
                  min="0"
                  max="500"
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.0x</span>
                  <span>500.0x+</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-1">
                <div>
                  <input
                    type="text"
                    value={multiplierMin}
                    onChange={(e) => setMultiplierMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={multiplierMax}
                    onChange={(e) => setMultiplierMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Views */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-normal">Views</h3>
                <div className="ml-2 text-gray-400 cursor-help">
                  <FaInfoCircle size={12} />
                </div>
              </div>
              <div className="mb-1">
                <input
                  type="range"
                  min="0"
                  max="1000000000"
                  step="1000"
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>1B+</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-1">
                <div>
                  <input
                    type="text"
                    value={viewsMin}
                    onChange={(e) => setViewsMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={viewsMax}
                    onChange={(e) => setViewsMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Subscribers */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-normal">Subscribers</h3>
                <div className="ml-2 text-gray-400 cursor-help">
                  <FaInfoCircle size={12} />
                </div>
              </div>
              <div className="mb-1">
                <input
                  type="range"
                  min="0"
                  max="500000000"
                  step="1000"
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>500M+</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-1">
                <div>
                  <input
                    type="text"
                    value={subscribersMin}
                    onChange={(e) => setSubscribersMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={subscribersMax}
                    onChange={(e) => setSubscribersMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Video duration */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-normal">Video duration</h3>
                <div className="ml-2 text-gray-400 cursor-help">
                  <FaInfoCircle size={12} />
                </div>
              </div>
              <div className="mb-1">
                <input
                  type="range"
                  min="0"
                  max="420"
                  step="1"
                  className="search-filter-range w-full"
                />
              </div>
              
              <div className="flex justify-between mt-1">
                <div>
                  <input
                    type="text"
                    value={videoDurationMin}
                    onChange={(e) => setVideoDurationMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={videoDurationMax}
                    onChange={(e) => setVideoDurationMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* When posted checkbox */}
            <div className="mb-3">
              <label className="checkbox-container flex items-center">
                <input
                  type="checkbox"
                  checked={whenPosted}
                  onChange={(e) => setWhenPosted(e.target.checked)}
                  className="hidden"
                />
                <span className="checkmark"></span>
                <span className="ml-3 text-sm">When posted</span>
              </label>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Time range and calendar */}
          <div>
            {/* Time range */}
            <div className="mb-3">
              <h3 className="text-sm font-normal mb-1">Time range</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('30 Days')}
                  >
                    <span className="text-xs">Last 30 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('90 Days')}
                  >
                    <span className="text-xs">Last 90 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('180 Days')}
                  >
                    <span className="text-xs">Last 180 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('365 Days')}
                  >
                    <span className="text-xs">Last 365 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                </div>
                
                <div className="space-y-1">
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('3 Years')}
                  >
                    <span className="text-xs">Last 3 Years</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className="flex justify-between items-center w-full bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('All Time')}
                  >
                    <span className="text-xs">All Time</span>
                    <span className="text-white text-xs">▶</span>
                  </button>
                  
                  <button 
                    className="flex justify-between items-center w-full bg-zinc-900 hover:bg-zinc-800 px-3 py-1 rounded-full"
                    onClick={() => handleTimeRangeSelect('Custom')}
                  >
                    <span className="text-xs">Custom</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-xs"
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-xs"
                    placeholder="End date"
                  />
                </div>
              </div>
              
              {/* Calendar */}
              <div className="mt-2 bg-zinc-900 p-2 rounded-md">
                <div className="text-xs">
                  {/* Month & Year Navigation */}
                  <div className="flex justify-between mb-1 text-xxs">
                    <button className="text-gray-400">&lt;</button>
                    <div className="text-gray-400">{selectedMonth}</div>
                    <button className="text-gray-400">&gt;</button>
                  </div>
                  
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="text-center text-xxs text-gray-400">{day}</div>
                    ))}
                    
                    {/* Calendar days - reduced size for compactness */}
                    <div className="text-center py-0.5 text-xxs text-gray-400">30</div>
                    <div className="text-center py-0.5 text-xxs text-gray-400">31</div>
                    <div className="text-center py-0.5 text-xxs">1</div>
                    <div className="text-center py-0.5 text-xxs">2</div>
                    <div className="text-center py-0.5 text-xxs">3</div>
                    <div className="text-center py-0.5 text-xxs">4</div>
                    <div className="text-center py-0.5 text-xxs">5</div>
                    
                    <div className="text-center py-0.5 text-xxs">6</div>
                    <div className="text-center py-0.5 text-xxs">7</div>
                    <div className="text-center py-0.5 text-xxs">8</div>
                    <div className="text-center py-0.5 text-xxs">9</div>
                    <div className="text-center py-0.5 text-xxs">10</div>
                    <div className="text-center py-0.5 text-xxs">11</div>
                    <div className="text-center py-0.5 text-xxs">12</div>
                    
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">13</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">14</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">15</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">16</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">17</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">18</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">19</div>
                    
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">20</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">21</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">22</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">23</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">24</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">25</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">26</div>
                    
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">27</div>
                    <div className="text-center py-0.5 text-xxs bg-red-600 rounded-full">28</div>
                    <div className="text-center py-0.5 text-xxs">1</div>
                    <div className="text-center py-0.5 text-xxs">2</div>
                    <div className="text-center py-0.5 text-xxs">3</div>
                    <div className="text-center py-0.5 text-xxs">4</div>
                    <div className="text-center py-0.5 text-xxs">5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Advanced filters toggle - moved to bottom */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-normal">Advanced filters</h3>
            <button 
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="text-red-600 hover:underline flex items-center text-xs"
            >
              {isAdvancedFiltersOpen ? 'Hide' : 'Show'}
              <FaChevronDown 
                className={`ml-1 transform ${isAdvancedFiltersOpen ? 'rotate-180' : ''}`}
                size={10}
              />
            </button>
          </div>
        </div>
        
        {/* Advanced filters section - full width */}
        {isAdvancedFiltersOpen && (
          <div className="mb-5 border-t border-zinc-800 pt-3 mt-3">
            <div className="grid grid-cols-4 gap-5">
              {/* First column */}
              <div>
                {/* Views : Subs ratio */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Views : Subs ratio</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={viewsToSubsRatioMin}
                        onChange={(e) => setViewsToSubsRatioMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={viewsToSubsRatioMax}
                        onChange={(e) => setViewsToSubsRatioMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Channel number of videos */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Channel number of videos</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="100000"
                      step="100"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={channelVideoCountMin}
                        onChange={(e) => setChannelVideoCountMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={channelVideoCountMax}
                        onChange={(e) => setChannelVideoCountMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Second column */}
              <div>
                {/* Median views */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Median views</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="400000000"
                      step="1000"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={medianViewsMin}
                        onChange={(e) => setMedianViewsMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={medianViewsMax}
                        onChange={(e) => setMedianViewsMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Video likes */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Video likes</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="50000000"
                      step="1000"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={videoLikesMin}
                        onChange={(e) => setVideoLikesMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={videoLikesMax}
                        onChange={(e) => setVideoLikesMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Third column */}
              <div>
                {/* Channel total views */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Channel total views</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="100000000000"
                      step="10000"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={channelTotalViewsMin}
                        onChange={(e) => setChannelTotalViewsMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={channelTotalViewsMax}
                        onChange={(e) => setChannelTotalViewsMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Video comments */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Video comments</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="5000000"
                      step="1000"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={videoCommentsMin}
                        onChange={(e) => setVideoCommentsMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={videoCommentsMax}
                        onChange={(e) => setVideoCommentsMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fourth column */}
              <div>
                {/* Engagement rate */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Engagement rate</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={engagementRateMin}
                        onChange={(e) => setEngagementRateMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={engagementRateMax}
                        onChange={(e) => setEngagementRateMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Channel age */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Channel age</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <div className="mb-1">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      className="search-filter-range w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <div>
                      <input
                        type="text"
                        value={channelAgeMin}
                        onChange={(e) => setChannelAgeMin(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mx-1 text-gray-400 text-xs">TO</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={channelAgeMax}
                        onChange={(e) => setChannelAgeMax(e.target.value)}
                        className="w-20 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Include/Exclude row - 2 columns */}
            <div className="grid grid-cols-2 gap-5 mt-2">
              <div>
                {/* Include these channels */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Include these channels</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={includeChannels}
                    onChange={(e) => setIncludeChannels(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-xs"
                    placeholder="@Channels separated by space, comma or enter."
                  />
                </div>
                
                {/* Exclude channels */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Exclude channels</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={excludeChannels}
                    onChange={(e) => setExcludeChannels(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-xs"
                    placeholder="@Channels separated by space, comma or enter."
                  />
                </div>
              </div>
              
              <div>
                {/* Include these keywords */}
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Include these keywords</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={includeKeywords}
                    onChange={(e) => setIncludeKeywords(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-xs"
                    placeholder="Keywords separated by comma or enter."
                  />
                </div>
                
                {/* Exclude keywords */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-xs font-normal">Exclude keywords</h4>
                    <div className="ml-2 text-gray-400 cursor-help">
                      <FaInfoCircle size={10} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={excludeKeywords}
                    onChange={(e) => setExcludeKeywords(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-xs"
                    placeholder="Keywords separated by comma or enter."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer with actions */}
        <div className="mt-3 flex justify-end items-center">
          <div className="flex space-x-3">  
            <button 
              onClick={onReset}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded-full text-xs"
            >
              Reset
            </button>
            
            <button 
              onClick={handleApply}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 