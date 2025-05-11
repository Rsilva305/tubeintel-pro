'use client';

import React, { useState, useEffect } from 'react';
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
  // Helper functions for parsing values
  const parseNumberValue = (value: string): number | null => {
    if (!value) return null;
    
    // Handle "+" suffix
    if (value.includes('+')) {
      value = value.replace('+', '');
    }
    
    // Handle K, M, B suffixes
    if (value.includes('K') || value.includes('k')) {
      return parseFloat(value.replace(/[Kk]/g, '')) * 1000;
    } else if (value.includes('M') || value.includes('m')) {
      return parseFloat(value.replace(/[Mm]/g, '')) * 1000000;
    } else if (value.includes('B') || value.includes('b')) {
      return parseFloat(value.replace(/[Bb]/g, '')) * 1000000000;
    }
    
    return parseFloat(value);
  };
  
  const parseDurationValue = (value: string): number | null => {
    if (!value) return null;
    
    // Handle HH:MM:SS format
    const parts = value.split(':').map(part => parseInt(part, 10));
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1]; // Convert to minutes
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    
    // Handle values with + suffix
    if (value.includes('+')) {
      return parseFloat(value.replace(/\+/g, ''));
    }
    
    return parseFloat(value);
  };

  // Search precision state
  const [searchPrecision, setSearchPrecision] = useState<SearchPrecision>('Hybrid');
  
  // Content format state
  const [contentFormat, setContentFormat] = useState<ContentFormat>('Videos');
  
  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>('All Time');
  const [startDate, setStartDate] = useState('2005-02-13');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [calendarDays, setCalendarDays] = useState<{day: number, month: number, year: number, isCurrentMonth: boolean}[]>([]);
  
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
  
  // Generate calendar days array
  useEffect(() => {
    generateCalendarDays();
  }, [selectedMonth, selectedYear]);

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const days = [];
    
    // Add days from previous month to fill in the first week
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const lastDayOfPrevMonth = new Date(prevMonthYear, selectedMonth, 0).getDate();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        day: lastDayOfPrevMonth - startingDayOfWeek + i + 1,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to complete the grid (up to 42 total days for 6 rows)
    const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const nextMonthYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const totalDaysAdded = days.length;
    const daysNeeded = Math.ceil(totalDaysAdded / 7) * 7 - totalDaysAdded;
    
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    
    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    // Create a date string in ISO format (YYYY-MM-DD)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // If timeRange is not 'Custom', set it to 'Custom' first
    if (timeRange !== 'Custom') {
      setTimeRange('Custom');
    }
    
    // If no dates selected yet or both dates already selected, start a new selection
    if (selectedDates.length === 0 || selectedDates.length === 2) {
      setSelectedDates([day]);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } 
    // If one date is selected, complete the range
    else if (selectedDates.length === 1) {
      const firstDate = new Date(startDate);
      const clickedDate = new Date(dateStr);
      
      // Ensure start date is always before end date
      if (clickedDate < firstDate) {
        setStartDate(dateStr);
        setEndDate(firstDate.toISOString().split('T')[0]);
      } else {
        setEndDate(dateStr);
      }
      
      setSelectedDates([selectedDates[0], day]);
    }
  };

  const isDateInRange = (day: number, month: number, year: number) => {
    if (timeRange !== 'Custom' || !startDate || !endDate) return false;
    
    const date = new Date(year, month, day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set times to beginning and end of day to include the full days
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return date >= start && date <= end;
  };

  const handleTimeRangeSelect = (range: TimeRange) => {
    setTimeRange(range);
    
    // If selecting a preset time range, calculate and set the appropriate date range
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of current day
    
    let start = new Date(now);
    
    switch (range) {
      case '30 Days':
        start.setDate(now.getDate() - 30);
        break;
      case '90 Days':
        start.setDate(now.getDate() - 90);
        break;
      case '180 Days':
        start.setDate(now.getDate() - 180);
        break;
      case '365 Days':
        start.setDate(now.getDate() - 365);
        break;
      case '3 Years':
        start.setFullYear(now.getFullYear() - 3);
        break;
      case 'All Time':
        start = new Date('2005-02-14'); // YouTube's founding date
        break;
      case 'Custom':
        // Don't change the dates when selecting "Custom"
        return;
    }
    
    start.setHours(0, 0, 0, 0); // Start of day
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
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
      <div className="bg-black rounded-3xl w-[1200px] relative text-white p-5 mx-4 my-4 z-10 max-h-[85vh] overflow-y-auto">
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
            
            {/* Rest of sliders would go here... */}
          </div>
          
          {/* RIGHT COLUMN - Time range and calendar */}
          <div>
            {/* Time range */}
            <div className="mb-3">
              <h3 className="text-sm font-normal mb-1">Time range</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === '30 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('30 Days')}
                  >
                    <span className="text-xs">Last 30 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === '90 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('90 Days')}
                  >
                    <span className="text-xs">Last 90 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === '180 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('180 Days')}
                  >
                    <span className="text-xs">Last 180 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === '365 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('365 Days')}
                  >
                    <span className="text-xs">Last 365 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                </div>
                
                <div className="space-y-1">
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === '3 Years' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('3 Years')}
                  >
                    <span className="text-xs">Last 3 Years</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === 'All Time' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('All Time')}
                  >
                    <span className="text-xs">All Time</span>
                    <span className="text-white text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${
                      timeRange === 'Custom' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'
                    } px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('Custom')}
                  >
                    <span className="text-xs">Custom</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                </div>
              </div>
              
              {/* Date input fields */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={formatDateForDisplay(startDate)}
                    onChange={(e) => {
                      try {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          setStartDate(date.toISOString().split('T')[0]);
                          // If we're not already in Custom mode, switch to it
                          if (timeRange !== 'Custom') {
                            setTimeRange('Custom');
                          }
                        }
                      } catch (e) {
                        // Invalid date format, keep the existing value
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-xs"
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formatDateForDisplay(endDate)}
                    onChange={(e) => {
                      try {
                        const date = new Date(e.target.value);
                        if (!isNaN(date.getTime())) {
                          setEndDate(date.toISOString().split('T')[0]);
                          // If we're not already in Custom mode, switch to it
                          if (timeRange !== 'Custom') {
                            setTimeRange('Custom');
                          }
                        }
                      } catch (e) {
                        // Invalid date format, keep the existing value
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-full text-white text-xs"
                    placeholder="End date"
                  />
                </div>
              </div>
              
              {/* Calendar */}
              <div className="mt-2 bg-zinc-900 p-2 rounded-2xl">
                <div className="text-xs">
                  {/* Month & Year Navigation */}
                  <div className="flex justify-between mb-1 text-xxs">
                    <button 
                      className="text-gray-400 hover:text-red-600 rounded-full w-5 h-5 flex items-center justify-center"
                      onClick={handlePrevMonth}
                    >
                      &lt;
                    </button>
                    <div className="text-gray-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-600 rounded-full w-5 h-5 flex items-center justify-center"
                      onClick={handleNextMonth}
                    >
                      &gt;
                    </button>
                  </div>
                  
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="text-center text-xxs text-gray-400">{day}</div>
                    ))}
                    
                    {/* Calendar days - more dynamic based on the actual month */}
                    {calendarDays.map((dateObj, i) => (
                      <div 
                        key={i}
                        onClick={() => handleDateClick(dateObj.day, dateObj.month, dateObj.year)}
                        className={`text-center py-0.5 text-xxs cursor-pointer hover:bg-red-600/50 rounded-full
                          ${!dateObj.isCurrentMonth ? 'text-gray-400' : ''}
                          ${isDateInRange(dateObj.day, dateObj.month, dateObj.year) ? 'bg-red-600' : ''}
                        `}
                      >
                        {dateObj.day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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