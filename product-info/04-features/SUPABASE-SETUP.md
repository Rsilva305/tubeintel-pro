# Supabase Setup for Competitor Tracking

This document explains how to set up the Supabase database for the competitor tracking feature.

## Database Schema

The competitor tracking feature uses two main tables:

1. `competitor_lists` - Stores the competitor lists created by users
2. `tracked_competitors` - Stores the competitors associated with each list

## Setup Steps

### 1. Set Up Supabase Project

If you haven't already, create a new Supabase project:

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project
3. Copy your project URL and anon key to your `.env.local` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Create Database Tables

You can set up the necessary tables by running the SQL script in `supabase/migrations/01_create_competitor_tables.sql` in the SQL Editor in the Supabase dashboard.

Alternatively, you can run the following SQL:

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

-- Create policies for competitor_lists
CREATE POLICY "Users can view their own competitor lists" 
ON public.competitor_lists
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor lists" 
ON public.competitor_lists
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor lists" 
ON public.competitor_lists
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor lists" 
ON public.competitor_lists
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for tracked_competitors
CREATE POLICY "Users can view competitors in their lists" 
ON public.tracked_competitors
FOR SELECT 
USING (
    list_id IN (
        SELECT id FROM public.competitor_lists 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can add competitors to their lists" 
ON public.tracked_competitors
FOR INSERT 
WITH CHECK (
    list_id IN (
        SELECT id FROM public.competitor_lists 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update competitors in their lists" 
ON public.tracked_competitors
FOR UPDATE 
USING (
    list_id IN (
        SELECT id FROM public.competitor_lists 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete competitors from their lists" 
ON public.tracked_competitors
FOR DELETE 
USING (
    list_id IN (
        SELECT id FROM public.competitor_lists 
        WHERE user_id = auth.uid()
    )
);
```

### 3. Testing

You can test if the setup is working correctly by:

1. Creating a user account in your app
2. Creating a competitor list
3. Adding competitors to the list
4. Viewing the records in the Supabase dashboard

## Table Structure

### competitor_lists

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| name | TEXT | Name of the list |
| description | TEXT | Description of the list |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### tracked_competitors

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| list_id | UUID | Foreign key to competitor_lists |
| youtube_id | TEXT | YouTube channel ID |
| name | TEXT | Channel name |
| thumbnail_url | TEXT | Channel thumbnail URL |
| subscriber_count | INTEGER | Number of subscribers |
| video_count | INTEGER | Number of videos |
| view_count | INTEGER | Total views |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Notes

- The `isPinned` property used in the frontend is not stored in the database. Instead, it's stored in localStorage for simplicity.
- Row Level Security is enabled on both tables to ensure users can only access their own data.
- The `tracked_competitors` table has a unique constraint on `(list_id, youtube_id)` to prevent duplicate competitors in a list. 