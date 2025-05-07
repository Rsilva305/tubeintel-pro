# TubeIntel Pro: Competitor Tracking Feature

This document provides instructions on how to set up and use the competitor tracking feature in TubeIntel Pro.

## Overview

The competitor tracking feature allows you to:
- Create lists of YouTube competitors to track
- Add YouTube channels to your competitor lists
- View and compare subscriber counts, video counts, and view counts
- Keep all your competitor research organized

## Database Setup

The competitor tracking feature uses Supabase for data storage. Two tables are required:

1. **competitor_lists**: Stores your competitor lists
2. **tracked_competitors**: Stores the actual competitor channels you're tracking

### SQL Setup Script

You can set up the necessary tables by running the following SQL script in your Supabase SQL Editor:

```sql
-- Create a table for competitor lists
CREATE TABLE IF NOT EXISTS public.competitor_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for tracked competitors
CREATE TABLE IF NOT EXISTS public.tracked_competitors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    list_id UUID REFERENCES public.competitor_lists(id) ON DELETE CASCADE,
    youtube_id TEXT NOT NULL,
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    subscriber_count INTEGER,
    video_count INTEGER,
    view_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, youtube_id)
);

-- Enable Row Level Security on both tables
ALTER TABLE public.competitor_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_competitors ENABLE ROW LEVEL SECURITY;

-- Create policies for competitor lists
CREATE POLICY IF NOT EXISTS "Users can view their own competitor lists" 
    ON public.competitor_lists 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own competitor lists" 
    ON public.competitor_lists 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own competitor lists" 
    ON public.competitor_lists 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own competitor lists" 
    ON public.competitor_lists 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create policies for tracked competitors
CREATE POLICY IF NOT EXISTS "Users can view tracked competitors in their lists" 
    ON public.tracked_competitors 
    FOR SELECT 
    USING ((SELECT user_id FROM public.competitor_lists WHERE id = list_id) = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert tracked competitors to their lists" 
    ON public.tracked_competitors 
    FOR INSERT 
    WITH CHECK ((SELECT user_id FROM public.competitor_lists WHERE id = list_id) = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update tracked competitors in their lists" 
    ON public.tracked_competitors 
    FOR UPDATE 
    USING ((SELECT user_id FROM public.competitor_lists WHERE id = list_id) = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete tracked competitors from their lists" 
    ON public.tracked_competitors 
    FOR DELETE 
    USING ((SELECT user_id FROM public.competitor_lists WHERE id = list_id) = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitor_lists_user_id ON public.competitor_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_competitors_list_id ON public.tracked_competitors(list_id);
```

## Using the Feature

### Demo Mode vs. Real API Mode

The application includes both demo mode and real API mode:

- **Demo Mode**: Uses mock data and doesn't make real database changes
- **Real API Mode**: Uses your Supabase database to store and retrieve data

You can toggle between these modes using the switch in the competitor tracking pages.

### Creating Competitor Lists

1. Navigate to the Competitors page in the dashboard
2. Click "Create new list"
3. Enter a name and optional description for your list
4. Click "Create list"

### Adding Competitors to a List

1. Click on a competitor list to view its details
2. Click "Add Competitor"
3. Enter the YouTube Channel ID (required)
4. Enter an optional name (if not provided, it will use the ID or try to fetch from YouTube)
5. Click "Add Competitor"

### Finding YouTube Channel IDs

YouTube Channel IDs can be found:
1. In the URL of the channel (e.g., `https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw`)
2. In the page source of a YouTube channel
3. Using third-party tools that extract channel IDs

### Tracking Competitor Metrics

The system tracks:
- Subscriber counts
- Video counts
- Total view counts

When using Real API mode with a valid YouTube API key, competitor data will be automatically fetched from YouTube when you add a competitor.

## YouTube API Integration

For enhanced functionality:

1. Obtain a YouTube Data API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the YouTube Data API v3
3. Add your API key to your environment variables:
   ```
   YOUTUBE_API_KEY=your_api_key_here
   ```

## Troubleshooting

### Common Issues

1. **Database Changes Not Saving**: Check if you're in Demo Mode - switch to Real API Mode
2. **Channel Data Not Loading**: Check your YouTube API key and quota limits
3. **Authentication Errors**: Ensure you're properly logged in
4. **Missing Tables**: Run the SQL setup script in your Supabase SQL Editor

For additional help, check the application logs or contact support. 