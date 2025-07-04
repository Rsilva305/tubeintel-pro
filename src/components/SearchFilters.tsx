'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaInfoCircle, FaChevronDown, FaCalendarAlt } from 'react-icons/fa';
import '@/styles/dualSlider.css';

// Dual Slider Component
interface DualSliderProps {
  min: number;
  max: number;
  step: number | string;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  className?: string;
}

const DualSlider: React.FC<DualSliderProps> = ({
  min,
  max,
  step,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  className = ''
}) => {
  // Ensure minValue doesn't exceed maxValue
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (newValue <= maxValue) {
      onMinChange(newValue);
    }
  };

  // Ensure maxValue doesn't fall below minValue
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (newValue >= minValue) {
      onMaxChange(newValue);
    }
  };

  return (
    <div className={`relative w-full h-6 ${className}`}>
      {/* Custom track */}
      <div 
        className="absolute w-full h-1 bg-zinc-700 top-1/2 transform -translate-y-1/2 rounded" 
        style={{ zIndex: -10 }}
      ></div>
      
      {/* Min value slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValue}
        onChange={handleMinChange}
        className="absolute w-full thumb-left search-filter-range"
        style={{ height: '100%' }}
      />
      
      {/* Max value slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValue}
        onChange={handleMaxChange}
        className="absolute w-full thumb-right search-filter-range"
        style={{ height: '100%' }}
      />
    </div>
  );
};

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

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
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

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [startDate, setStartDate] = useState('2005-02-13');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [calendarDays, setCalendarDays] = useState<{day: number, month: number, year: number, isCurrentMonth: boolean}[]>([]);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  
  // Range sliders state
  const [multiplierMin, setMultiplierMin] = useState('0.0x');
  const [multiplierMax, setMultiplierMax] = useState('100.0x+');
  const [viewsMin, setViewsMin] = useState('0');
  const [viewsMax, setViewsMax] = useState('1M+');
  const [subscribersMin, setSubscribersMin] = useState('0');
  const [subscribersMax, setSubscribersMax] = useState('1M+');
  const [videoDurationMin, setVideoDurationMin] = useState('00:00:00');
  const [videoDurationMax, setVideoDurationMax] = useState('07:00:00+');
  
  // When posted checkbox
  const [whenPosted, setWhenPosted] = useState(false);
  
  // Advanced filters state
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [viewsToSubsRatioMin, setViewsToSubsRatioMin] = useState('0.0');
  const [viewsToSubsRatioMax, setViewsToSubsRatioMax] = useState('50.0+');
  const [medianViewsMin, setMedianViewsMin] = useState('0');
  const [medianViewsMax, setMedianViewsMax] = useState('10M+');
  const [channelTotalViewsMin, setChannelTotalViewsMin] = useState('0');
  const [channelTotalViewsMax, setChannelTotalViewsMax] = useState('1B+');
  const [channelVideoCountMin, setChannelVideoCountMin] = useState('0');
  const [channelVideoCountMax, setChannelVideoCountMax] = useState('1k+');
  const [videoLikesMin, setVideoLikesMin] = useState('0');
  const [videoLikesMax, setVideoLikesMax] = useState('1M+');
  const [videoCommentsMin, setVideoCommentsMin] = useState('0');
  const [videoCommentsMax, setVideoCommentsMax] = useState('100K+');
  const [engagementRateMin, setEngagementRateMin] = useState('0');
  const [engagementRateMax, setEngagementRateMax] = useState('20+');
  const [channelAgeMin, setChannelAgeMin] = useState('Brand new');
  const [channelAgeMax, setChannelAgeMax] = useState('20 years ago+');
  const [includeChannels, setIncludeChannels] = useState('');
  const [excludeChannels, setExcludeChannels] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  
  // Define the updateSelectedDatesForCurrentMonth function using useCallback
  const updateSelectedDatesForCurrentMonth = useCallback(() => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    // If the selected month/year matches either date, update the selectedDates
    if ((startMonth === selectedMonth && startYear === selectedYear) || 
        (endMonth === selectedMonth && endYear === selectedYear)) {
      
      // If both start and end dates are in the current month view
      if (startMonth === selectedMonth && startYear === selectedYear && 
          endMonth === selectedMonth && endYear === selectedYear) {
        setSelectedDates([startDay, endDay]);
      } 
      // If only the start date is in the current month view
      else if (startMonth === selectedMonth && startYear === selectedYear) {
        setSelectedDates([startDay]);
      }
      // If only the end date is in the current month view
      else if (endMonth === selectedMonth && endYear === selectedYear) {
        setSelectedDates([endDay]);
      }
    } else {
      // Neither date is in the current month view
      setSelectedDates([]);
    }
  }, [startDate, endDate, selectedMonth, selectedYear, setSelectedDates]);
  
  // Generate calendar days array
  useEffect(() => {
    generateCalendarDays();
  }, [selectedMonth, selectedYear]);
  
  // Update selected dates when month/year or date range changes
  useEffect(() => {
    updateSelectedDatesForCurrentMonth();
  }, [updateSelectedDatesForCurrentMonth]);

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
    
    // Set the date based on which field is active
    if (activeField === 'start') {
      setStartDate(dateStr);
      // If the new start date is after the current end date, update end date too
      const newStart = new Date(dateStr);
      const currentEnd = new Date(endDate);
      if (newStart > currentEnd) {
        setEndDate(dateStr);
      }
      // Move focus to the end field after selecting start date
      setActiveField('end');
      // Update selected dates for highlighting
      const startDay = new Date(dateStr).getDate();
      setSelectedDates([startDay]);
    } else if (activeField === 'end') {
      // If the selected end date is before the start date, update the start date instead
      const currentStart = new Date(startDate);
      const newEnd = new Date(dateStr);
      if (newEnd < currentStart) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
      // Close the calendar after selecting the end date
      setIsCalendarVisible(false);
      setActiveField(null);
      // Update selected dates for highlighting
      const endDay = new Date(dateStr).getDate();
      setSelectedDates([endDay]);
    }
  };

  const isDateInRange = (day: number, month: number, year: number) => {
    if (!startDate || !endDate) return false;
    
    const date = new Date(year, month, day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set times to beginning and end of day to include the full days
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    
    // If we're selecting the start date, only highlight the start date
    if (activeField === 'start') {
      return date.getDate() === start.getDate() && 
             date.getMonth() === start.getMonth() && 
             date.getFullYear() === start.getFullYear();
    }
    
    // If we're selecting the end date, only highlight the end date
    if (activeField === 'end') {
      return date.getDate() === end.getDate() && 
             date.getMonth() === end.getMonth() && 
             date.getFullYear() === end.getFullYear();
    }
    
    // When not actively selecting, show the full range
    return date >= start && date <= end;
  };

  const handleTimeRangeSelect = (range: TimeRange) => {
    // If clicking the same range that's already selected, unselect it
    if (timeRange === range) {
      setTimeRange(null);
      return;
    }
    
    setTimeRange(range);
    
    // If selecting a preset time range, calculate and set the appropriate date range
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of current day
    
    let start = new Date(now);
    
    switch (range) {
      case '30 Days':
        start.setDate(now.getDate() - 30);
        setIsCalendarVisible(false);
        break;
      case '90 Days':
        start.setDate(now.getDate() - 90);
        setIsCalendarVisible(false);
        break;
      case '180 Days':
        start.setDate(now.getDate() - 180);
        setIsCalendarVisible(false);
        break;
      case '365 Days':
        start.setDate(now.getDate() - 365);
        setIsCalendarVisible(false);
        break;
      case '3 Years':
        start.setFullYear(now.getFullYear() - 3);
        setIsCalendarVisible(false);
        break;
      case 'All Time':
        start = new Date('2005-02-14'); // YouTube's founding date
        setIsCalendarVisible(false);
        break;
      case 'Custom':
        // Don't show calendar immediately when selecting Custom
        setIsCalendarVisible(false);
        // Don't change the dates when selecting "Custom"
        return;
    }
    
    start.setHours(0, 0, 0, 0); // Start of day
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  };

  // Reset all filters when opening the modal
  useEffect(() => {
    if (isOpen) {
      setTimeRange(null);
      setStartDate('2005-02-13');
      setEndDate(new Date().toISOString().split('T')[0]);
      // ... reset other filters ...
    }
  }, [isOpen]);

  const handleApply = () => {
    const filters = {
      timeRange: timeRange || 'All Time', // Use 'All Time' as default if no range selected
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
            {/* Multiplier */}
            <div className="mb-3">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-normal">Multiplier</h3>
                <div className="ml-2 text-gray-400 cursor-help">
                  <FaInfoCircle size={12} />
                </div>
              </div>
              <div className="mb-1">
                <DualSlider
                  min={0}
                  max={100}
                  step={0.1}
                  minValue={parseNumberValue(multiplierMin.replace('x', '')) || 0}
                  maxValue={parseNumberValue(multiplierMax.replace('x', '').replace('+', '')) || 100}
                  onMinChange={(value) => setMultiplierMin(`${value.toFixed(1)}x`)}
                  onMaxChange={(value) => setMultiplierMax(value >= 100 ? '100.0x+' : `${value.toFixed(1)}x`)}
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.0x</span>
                  <span>100.0x+</span>
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
                <DualSlider
                  min={0}
                  max={1000000}
                  step={1000}
                  minValue={parseNumberValue(viewsMin) || 0}
                  maxValue={parseNumberValue(viewsMax.replace('+', '')) || 1000000}
                  onMinChange={(value) => setViewsMin(formatNumber(value))}
                  onMaxChange={(value) => setViewsMax(value >= 1000000 ? '1M+' : formatNumber(value))}
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>1M+</span>
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
                <DualSlider
                  min={0}
                  max={1000000}
                  step={1000}
                  minValue={parseNumberValue(subscribersMin) || 0}
                  maxValue={parseNumberValue(subscribersMax.replace('+', '')) || 1000000}
                  onMinChange={(value) => setSubscribersMin(formatNumber(value))}
                  onMaxChange={(value) => setSubscribersMax(value >= 1000000 ? '1M+' : formatNumber(value))}
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>1M+</span>
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
                <DualSlider
                  min={0}
                  max={420}
                  step={1}
                  minValue={parseDurationValue(videoDurationMin) || 0}
                  maxValue={parseDurationValue(videoDurationMax.replace('+', '')) || 420}
                  onMinChange={(value) => {
                    const hours = Math.floor(value / 60);
                    const mins = value % 60;
                    setVideoDurationMin(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);
                  }}
                  onMaxChange={(value) => {
                    if (value >= 420) {
                      setVideoDurationMax('07:00:00+');
                    } else {
                      const hours = Math.floor(value / 60);
                      const mins = value % 60;
                      setVideoDurationMax(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);
                    }
                  }}
                  className="search-filter-range w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>00:00:00</span>
                  <span>07:00:00+</span>
                </div>
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
                    className={`flex justify-between items-center w-full ${timeRange === '30 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('30 Days')}
                  >
                    <span className="text-xs">Last 30 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === '90 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('90 Days')}
                  >
                    <span className="text-xs">Last 90 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === '180 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('180 Days')}
                  >
                    <span className="text-xs">Last 180 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === '365 Days' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('365 Days')}
                  >
                    <span className="text-xs">Last 365 Days</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                </div>
                
                <div className="space-y-1">
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === '3 Years' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('3 Years')}
                  >
                    <span className="text-xs">Last 3 Years</span>
                    <span className="text-gray-400 text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === 'All Time' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('All Time')}
                  >
                    <span className="text-xs">All Time</span>
                    <span className="text-white text-xs">▶</span>
                  </button>
                  
                  <button 
                    className={`flex justify-between items-center w-full ${timeRange === 'Custom' ? 'bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800'} px-3 py-1 rounded-full`}
                    onClick={() => handleTimeRangeSelect('Custom')}
                  >
                    <span className="text-xs flex items-center">
                      <FaCalendarAlt className="mr-1" size={10} /> Custom
                    </span>
                    <span className={`text-xs ${timeRange === 'Custom' ? 'text-white' : 'text-gray-400'}`}>
                      ▶
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Date input fields */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="relative">
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
                    onClick={() => {
                      setTimeRange('Custom');
                      setActiveField('start');
                      setIsCalendarVisible(true);
                      // Set calendar month/year to match the start date
                      const startDateObj = new Date(startDate);
                      setSelectedMonth(startDateObj.getMonth());
                      setSelectedYear(startDateObj.getFullYear());
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 pl-7 py-1 rounded-full text-white text-xs cursor-pointer relative group"
                    placeholder="Start date"
                    readOnly
                    title={`Selected start date: ${formatDateForDisplay(startDate)}`}
                  />
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaCalendarAlt size={10} />
                  </div>
                  <div className="absolute -top-8 left-0 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {formatDateForDisplay(startDate)}
                  </div>
                </div>
                <div className="relative">
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
                    onClick={() => {
                      setTimeRange('Custom');
                      setActiveField('end');
                      setIsCalendarVisible(true);
                      // Set calendar month/year to match the end date
                      const endDateObj = new Date(endDate);
                      setSelectedMonth(endDateObj.getMonth());
                      setSelectedYear(endDateObj.getFullYear());
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 px-2 pl-7 py-1 rounded-full text-white text-xs cursor-pointer relative group"
                    placeholder="End date"
                    readOnly
                    title={`Selected end date: ${formatDateForDisplay(endDate)}`}
                  />
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaCalendarAlt size={10} />
                  </div>
                  <div className="absolute -top-8 left-0 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {formatDateForDisplay(endDate)}
                  </div>
                </div>
              </div>
              
              {/* Calendar */}
              {isCalendarVisible && (
                <div className="mt-2 bg-zinc-900 p-2 rounded-2xl relative">
                  <button 
                    onClick={() => {
                      setIsCalendarVisible(false);
                      setActiveField(null);
                    }}
                    className="absolute top-1 right-1 text-gray-400 hover:text-white"
                    aria-label="Close calendar"
                  >
                    <FaTimes size={12} />
                  </button>
                  <div className="text-xs">
                    {/* Calendar title */}
                    <div className="text-center mb-1 text-gray-300">
                      {activeField === 'start' ? (
                        <span>Select Start Date: {formatDateForDisplay(startDate)}</span>
                      ) : (
                        <span>Select End Date: {formatDateForDisplay(endDate)}</span>
                      )}
                    </div>
                    
                    {/* Month & Year Navigation */}
                    <div className="flex justify-between mb-1 text-xxs gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="flex-1 bg-zinc-800 text-gray-300 px-2 py-0.5 rounded-full text-center text-xxs border-none outline-none cursor-pointer"
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      
                      <div className="flex items-center gap-1 flex-1">
                        <button 
                          onClick={() => setSelectedYear(selectedYear - 1)}
                          className="bg-zinc-800 text-gray-400 hover:text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1970"
                          max="2100"
                          value={selectedYear}
                          onChange={(e) => {
                            const year = parseInt(e.target.value);
                            if (!isNaN(year) && year >= 1970 && year <= 2100) {
                              setSelectedYear(year);
                            }
                          }}
                          className="flex-1 bg-zinc-800 text-gray-300 px-2 py-0.5 rounded-full text-center text-xxs border-none outline-none"
                        />
                        <button 
                          onClick={() => setSelectedYear(selectedYear + 1)}
                          className="bg-zinc-800 text-gray-400 hover:text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                        <div key={day} className="text-center text-xxs text-gray-400">{day}</div>
                      ))}
                      
                      {/* Calendar days */}
                      {calendarDays.map((dateObj, i) => {
                        const currentDate = new Date(dateObj.year, dateObj.month, dateObj.day);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        
                        // Set times to beginning and end of day to include the full days
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        currentDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                        
                        const isStartDate = dateObj.day === start.getDate() && 
                                          dateObj.month === start.getMonth() && 
                                          dateObj.year === start.getFullYear();
                        const isEndDate = dateObj.day === end.getDate() && 
                                        dateObj.month === end.getMonth() && 
                                        dateObj.year === end.getFullYear();
                        const isInRange = currentDate >= start && currentDate <= end;
                        
                        return (
                          <div 
                            key={i}
                            onClick={() => handleDateClick(dateObj.day, dateObj.month, dateObj.year)}
                            className={`text-center py-0.5 text-xxs cursor-pointer hover:bg-red-600/50 rounded-full
                              ${!dateObj.isCurrentMonth ? 'text-gray-400' : ''}
                              ${isStartDate ? 'bg-red-600 font-bold' : ''}
                              ${isEndDate ? 'bg-red-600 font-bold' : ''}
                              ${isInRange && !isStartDate && !isEndDate ? 'bg-red-600/50' : ''}
                            `}
                            title={`${dateObj.month + 1}/${dateObj.day}/${dateObj.year}`}
                          >
                            {dateObj.day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Apply button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleApply}
            className="bg-red-600 text-white px-4 py-2 rounded-full"
          >
            Apply
          </button>
        </div>

        {/* Show more options button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className="text-red-600 hover:text-red-500"
          >
            {isAdvancedFiltersOpen ? 'Show less options' : 'Show more options'}
          </button>
        </div>

        {/* Advanced filters section */}
        {isAdvancedFiltersOpen && (
          <div className="mt-4">
            <h3 className="text-sm font-normal mb-2">Advanced Filters</h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              {/* Views to Subs Ratio */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Views : Subs Ratio</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={50}
                    step={0.1}
                    minValue={parseNumberValue(viewsToSubsRatioMin) || 0}
                    maxValue={parseNumberValue(viewsToSubsRatioMax.replace('+', '')) || 50}
                    onMinChange={(value) => setViewsToSubsRatioMin(value.toFixed(1))}
                    onMaxChange={(value) => setViewsToSubsRatioMax(value >= 50 ? '50.0+' : value.toFixed(1))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0.0</span>
                    <span>50.0+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={viewsToSubsRatioMin}
                    onChange={e => setViewsToSubsRatioMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={viewsToSubsRatioMax}
                    onChange={e => setViewsToSubsRatioMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Median Views */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Median Views</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={10000000}
                    step={1000}
                    minValue={parseNumberValue(medianViewsMin) || 0}
                    maxValue={parseNumberValue(medianViewsMax.replace('+', '')) || 10000000}
                    onMinChange={(value) => setMedianViewsMin(formatNumber(value))}
                    onMaxChange={(value) => setMedianViewsMax(value >= 10000000 ? '10M+' : formatNumber(value))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>10M+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={medianViewsMin}
                    onChange={e => setMedianViewsMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={medianViewsMax}
                    onChange={e => setMedianViewsMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Channel Total Views */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Channel Total Views</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={1000000000}
                    step={100000}
                    minValue={parseNumberValue(channelTotalViewsMin) || 0}
                    maxValue={parseNumberValue(channelTotalViewsMax.replace('+', '')) || 1000000000}
                    onMinChange={(value) => setChannelTotalViewsMin(formatNumber(value))}
                    onMaxChange={(value) => setChannelTotalViewsMax(value >= 1000000000 ? '1B+' : formatNumber(value))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>1B+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={channelTotalViewsMin}
                    onChange={e => setChannelTotalViewsMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={channelTotalViewsMax}
                    onChange={e => setChannelTotalViewsMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Channel Video Count */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Channel Video Count</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={1000}
                    step={10}
                    minValue={parseNumberValue(channelVideoCountMin) || 0}
                    maxValue={parseNumberValue(channelVideoCountMax.replace('+', '')) || 1000}
                    onMinChange={(value) => setChannelVideoCountMin(value.toString())}
                    onMaxChange={(value) => setChannelVideoCountMax(value >= 1000 ? '1k+' : value.toString())}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>1k+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={channelVideoCountMin}
                    onChange={e => setChannelVideoCountMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={channelVideoCountMax}
                    onChange={e => setChannelVideoCountMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Video Likes */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Video Likes</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={1000000}
                    step={1000}
                    minValue={parseNumberValue(videoLikesMin) || 0}
                    maxValue={parseNumberValue(videoLikesMax.replace('+', '')) || 1000000}
                    onMinChange={(value) => setVideoLikesMin(formatNumber(value))}
                    onMaxChange={(value) => setVideoLikesMax(value >= 1000000 ? '1M+' : formatNumber(value))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>1M+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={videoLikesMin}
                    onChange={e => setVideoLikesMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={videoLikesMax}
                    onChange={e => setVideoLikesMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Video Comments */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Video Comments</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={100000}
                    step={100}
                    minValue={parseNumberValue(videoCommentsMin) || 0}
                    maxValue={parseNumberValue(videoCommentsMax.replace('+', '')) || 100000}
                    onMinChange={(value) => setVideoCommentsMin(formatNumber(value))}
                    onMaxChange={(value) => setVideoCommentsMax(value >= 100000 ? '100K+' : formatNumber(value))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>100K+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={videoCommentsMin}
                    onChange={e => setVideoCommentsMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={videoCommentsMax}
                    onChange={e => setVideoCommentsMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Engagement Rate</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={20}
                    step={0.1}
                    minValue={parseNumberValue(engagementRateMin) || 0}
                    maxValue={parseNumberValue(engagementRateMax.replace('+', '')) || 20}
                    onMinChange={(value) => setEngagementRateMin(value.toFixed(1))}
                    onMaxChange={(value) => setEngagementRateMax(value >= 20 ? '20+' : value.toFixed(1))}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>20+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={engagementRateMin}
                    onChange={e => setEngagementRateMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={engagementRateMax}
                    onChange={e => setEngagementRateMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Channel Age */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-normal">Channel Age</h3>
                  <div className="ml-2 text-gray-400 cursor-help">
                    <FaInfoCircle size={12} />
                  </div>
                </div>
                <div className="mb-1">
                  <DualSlider
                    min={0}
                    max={20}
                    step={1}
                    minValue={channelAgeMin === 'Brand new' ? 0 : parseNumberValue(channelAgeMin) || 0}
                    maxValue={channelAgeMax.includes('+') ? 20 : parseNumberValue(channelAgeMax) || 20}
                    onMinChange={(value) => setChannelAgeMin(value === 0 ? 'Brand new' : `${value} years ago`)}
                    onMaxChange={(value) => setChannelAgeMax(value >= 20 ? '20 years ago+' : `${value} years ago`)}
                    className="search-filter-range w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Brand new</span>
                    <span>20 years ago+</span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <input
                    type="text"
                    value={channelAgeMin}
                    onChange={e => setChannelAgeMin(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                  <span className="mx-2 text-gray-400 text-xs">TO</span>
                  <input
                    type="text"
                    value={channelAgeMax}
                    onChange={e => setChannelAgeMax(e.target.value)}
                    className="w-24 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-center text-sm"
                  />
                </div>
              </div>

              {/* Include Channels */}
              <div className="mb-3">
                <label className="text-xs text-gray-300 mb-1 block">Include Channels</label>
                <input
                  type="text"
                  value={includeChannels}
                  onChange={e => setIncludeChannels(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-sm"
                  placeholder="Enter channel names"
                />
              </div>

              {/* Exclude Channels */}
              <div className="mb-3">
                <label className="text-xs text-gray-300 mb-1 block">Exclude Channels</label>
                <input
                  type="text"
                  value={excludeChannels}
                  onChange={e => setExcludeChannels(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-sm"
                  placeholder="Enter channel names"
                />
              </div>

              {/* Include Keywords */}
              <div className="mb-3">
                <label className="text-xs text-gray-300 mb-1 block">Include Keywords</label>
                <input
                  type="text"
                  value={includeKeywords}
                  onChange={e => setIncludeKeywords(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-sm"
                  placeholder="Enter keywords"
                />
              </div>

              {/* Exclude Keywords */}
              <div className="mb-3">
                <label className="text-xs text-gray-300 mb-1 block">Exclude Keywords</label>
                <input
                  type="text"
                  value={excludeKeywords}
                  onChange={e => setExcludeKeywords(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full text-white text-sm"
                  placeholder="Enter keywords"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}