-- Add the channel_change_cooldown column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS channel_change_cooldown TIMESTAMP WITH TIME ZONE;

-- Add an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_channel_change_cooldown 
ON public.profiles(channel_change_cooldown);

-- Add a comment to explain the column's purpose
COMMENT ON COLUMN public.profiles.channel_change_cooldown IS 
'Timestamp of the last YouTube channel change. Users can only change their channel once every 7 days.';

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Create new policy with correct syntax
CREATE POLICY "Users can update their own profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated; 