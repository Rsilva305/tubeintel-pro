# Calendar Fix for Search Filters

This README contains instructions to fix the date range calendar in the Search Filters component.

## Issues with the current implementation

1. The calendar doesn't update the selected date range when clicking days
2. The month/year navigation buttons don't actually change the calendar view
3. The selected date range doesn't properly apply to the filters

## How to Fix

The fix for these issues is available in the file `SearchFilters.fixed.tsx`. Here are the key changes required:

1. **Store dates in ISO format**:
   - Change `startDate` and `endDate` to use ISO format (YYYY-MM-DD) instead of human-readable format
   - Update the visible date inputs to use a formatter for display

2. **Implement month/year navigation**:
   - Add handlers for the prev/next month buttons
   - Store month and year as JavaScript Date objects' numeric values (0-11 for months)

3. **Generate calendar days dynamically**:
   - Create a function that generates calendar days for the current month view
   - Include days from previous/next months for complete weeks

4. **Implement date selection**:
   - Add a `handleDateClick` function to update the selected date range
   - Highlight selected date range in the calendar
   - Switch to 'Custom' time range mode when manually selecting dates

5. **Update date format display**:
   - Add a formatter to display ISO dates in a user-friendly format in inputs
   - Parse user-entered dates back to ISO format

6. **Make time range buttons update date range**:
   - Update `handleTimeRangeSelect` to set appropriate start/end dates based on selection

## Implementation Steps

1. Review the sample component in `SearchFilters.fixed.tsx`
2. Replace your current calendar implementation with the one from the fixed version
3. Test the functionality by:
   - Navigating between months using the < and > buttons
   - Selecting dates by clicking on calendar days
   - Verifying that selected dates appear in the inputs
   - Checking that the filters are correctly applied with the selected date range

## Key Functions to Implement

```typescript
// Generate calendar grid data
const generateCalendarDays = () => { ... }

// Handle month navigation
const handlePrevMonth = () => { ... }
const handleNextMonth = () => { ... }

// Format dates for display
const formatDateForDisplay = (date: string) => { ... }

// Handle date selection
const handleDateClick = (day: number, month: number, year: number) => { ... }

// Check if a date is in the selected range
const isDateInRange = (day: number, month: number, year: number) => { ... }

// Update date range when a time range button is clicked
const handleTimeRangeSelect = (range: TimeRange) => { ... }
```

## Additional Improvements

1. Add visual indicators for the time range buttons to show which one is active
2. Add date validation to ensure start date is always before end date
3. Automatically update the date range inputs when selecting a preset time range 