# Database Troubleshooting Guide

## "Error creating list: unknown error" when creating competitor list

If you're getting this error when trying to create a competitor list, there are several potential causes and solutions:

### 1. Check if the Supabase database has the necessary tables

We've added a diagnostic page to help identify and fix database issues:

1. Visit `/test-db` in your browser (e.g., http://localhost:3000/test-db)
2. This page will check if:
   - You're properly authenticated
   - The competitor_lists table exists and is accessible
   - You can create and delete test lists

3. If any issues are detected, the page provides a "Fix Missing Tables" button to create the required tables.

### 2. API Mode Settings

**IMPORTANT UPDATE**: We've modified the application to always use Supabase for competitor lists, regardless of the API mode toggle setting. This ensures that:

1. Your competitor lists are always saved to the database
2. The API mode toggle (which appears in the bottom right corner of some pages) doesn't affect competitor list saving
3. Your data is consistently persisted

Recent fixes (2023-07-14):
- Added a dedicated `useRealApiForCompetitors()` function that always returns true
- Updated all competitorsAdapter functions to use this function instead of the general API toggle
- This ensures competitor lists are always saved to Supabase regardless of the API toggle state

You can test this functionality by visiting `/test-supabase-competitors` which allows you to:
- Check if competitor lists are being saved properly
- Test direct Supabase queries
- See detailed diagnostic information

### 3. Authentication Issues

If you encounter the error "new row violates row-level security policy for table competitor_lists", this indicates an authentication issue:

1. The competitor lists table is protected by Row Level Security (RLS) policies
2. These policies require you to be properly authenticated with Supabase
3. Having only localStorage data is not sufficient for these security policies

**How to Fix Authentication Issues**:
- A debugging panel will appear on the competitors page if authentication issues are detected
- Use the "Fix Authentication" button to sign in directly with Supabase
- After signing in, you should be able to create competitor lists

**Technical Details**:
- Recent changes now prioritize direct Supabase authentication over localStorage data
- This ensures proper RLS policy compliance 
- If you see this error, it usually means you're logged in with localStorage data only, not with Supabase

### 4. Local Development Solution

We've implemented a fallback mechanism that stores competitor lists in localStorage when the database is unavailable. This allows you to continue working even if there are database issues.

When the database becomes available again, lists created locally will be automatically synced to the database.

### 5. Manual Database Setup

If you need to manually set up the database tables:

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Execute the following SQL:

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

## Other Common Issues

### Row Level Security (RLS) Issues

If you're authenticated but still can't create or view competitor lists, it might be a Row Level Security (RLS) issue:

1. Check if Row Level Security is enabled on the competitor_lists table
2. Verify that the appropriate RLS policies are in place
3. Check if your authenticated user ID matches the user_id in the RLS policy

### Profile Table Issues

If you're having issues with the profiles table:

1. Make sure the profiles table exists
2. Check if your user has a corresponding entry in the profiles table
3. Verify that the has_completed_onboarding column exists (this was added in a recent fix)

## Contact Support

If you're still having issues after trying these solutions, please contact support with:
- Screenshots of any error messages
- Results from the test page
- Your Supabase project ID (not the API keys) 