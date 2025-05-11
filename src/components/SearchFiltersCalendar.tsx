'use client';

import React, { useState, useEffect } from 'react';

interface CalendarProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

export default function Calendar({ startDate, endDate, onDateChange }: CalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [calendarDays, setCalendarDays] = useState<{day: number, month: number, year: number, isCurrentMonth: boolean}[]>([]);

  // Generate calendar days array
  useEffect(() => {
    generateCalendarDays();
  }, [selectedMonth, selectedYear]);

  // Update selected dates when startDate or endDate change
  useEffect(() => {
    // Set the first selected date if there is a startDate
    if (startDate) {
      const date = new Date(startDate);
      if (!isNaN(date.getTime())) {
        // If the date is in the current month, select it
        if (date.getMonth() === selectedMonth && date.getFullYear() === selectedYear) {
          setSelectedDates([date.getDate()]);
        }
      }
    }
  }, [startDate, selectedMonth, selectedYear]);

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

  const handleDateClick = (day: number, month: number, year: number) => {
    // Create a date string in ISO format (YYYY-MM-DD)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // If no dates selected yet or both dates already selected, start a new selection
    if (selectedDates.length === 0 || selectedDates.length === 2) {
      setSelectedDates([day]);
      onDateChange(dateStr, dateStr);
    } 
    // If one date is selected, complete the range
    else if (selectedDates.length === 1) {
      const firstDate = new Date(startDate);
      const clickedDate = new Date(dateStr);
      
      // Ensure start date is always before end date
      if (clickedDate < firstDate) {
        onDateChange(dateStr, firstDate.toISOString().split('T')[0]);
      } else {
        onDateChange(startDate, dateStr);
      }
      
      setSelectedDates([selectedDates[0], day]);
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
    
    return date >= start && date <= end;
  };

  return (
    <div className="bg-zinc-900 p-2 rounded-2xl">
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
          
          {/* Calendar days */}
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
  );
} 