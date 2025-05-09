-- This SQL fixes the Row Level Security policies for the profiles table
-- Run this in the Supabase SQL Editor

-- First, check if we have INSERT and DELETE policies
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create INSERT policy if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND operation = 'INSERT'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON public.profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Create DELETE policy if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND operation = 'DELETE'
    ) THEN
        CREATE POLICY "Users can delete their own profile" 
        ON public.profiles 
        FOR DELETE 
        USING (auth.uid() = id);
    END IF;
    
END $$;

-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- List existing policies for verification (this is just for information)
SELECT * FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'; 