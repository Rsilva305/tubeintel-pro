# Onboarding Fix for TubeIntel Pro

This document explains how to fix the onboarding issue where users encounter the error "Failed to update profile: Could not find the 'has_completed_onboarding' column of 'profiles' in the schema cache" and get trapped in a redirect loop on the onboarding page.

## Fix Summary

The issue is caused by the onboarding page attempting to update a `has_completed_onboarding` column that doesn't exist in the `profiles` table.

Two fixes have been implemented:

1. **Database Migration**: A migration script to add the missing column
2. **Code Fixes**: Handling when the column doesn't exist and adding a logout button to the onboarding page

## How to Apply the Fix

### 1. Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the content of the migration file:

```sql
-- Add the has_completed_onboarding column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Update any existing profiles to have completed onboarding if they have a youtube_channel_id
UPDATE public.profiles
SET has_completed_onboarding = TRUE
WHERE youtube_channel_id IS NOT NULL;
```

5. Click "Run" to execute the query

Alternatively, you can use the Supabase CLI to run the migration:

```bash
npx supabase migrate up
```

### 2. Code Changes

The following files have been updated to fix the issue:

1. **src/app/onboarding/page.tsx**
   - Added fallback handling when `has_completed_onboarding` column doesn't exist
   - Added a logout button to allow users to sign out from the onboarding page
   - Added session timeout handling to refresh the page when a session is about to expire

2. **src/lib/supabase.ts**
   - Updated authentication functions to check for both `youtube_channel_id` and `has_completed_onboarding`
   - Added better type checking for the channel ID

### 3. Deploy the Changes

Deploy the changes to your production environment using your standard deployment process.

## Testing the Fix

1. Create a new user and go through the onboarding process
2. Check if the user can successfully connect their YouTube channel
3. Verify that the user is redirected to the dashboard after onboarding
4. Try leaving the onboarding page open for an extended period and see if it still works

## Additional Notes

- The fix is backward compatible with existing users
- Existing users with a YouTube channel ID will have `has_completed_onboarding` set to `true` after running the migration
- The logout button on the onboarding page serves as an escape route if a user gets stuck 