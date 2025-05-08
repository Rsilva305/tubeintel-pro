-- Add the has_completed_onboarding column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Update any existing profiles to have completed onboarding if they have a youtube_channel_id
UPDATE public.profiles
SET has_completed_onboarding = TRUE
WHERE youtube_channel_id IS NOT NULL; 