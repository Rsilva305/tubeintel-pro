-- Add the has_completed_onboarding column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Update existing profiles
-- If a profile has a youtube_channel_id, consider it as having completed onboarding
UPDATE public.profiles 
SET has_completed_onboarding = true 
WHERE youtube_channel_id IS NOT NULL AND youtube_channel_id != '';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'has_completed_onboarding'; 