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

-- Create policies for tracked competitors
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