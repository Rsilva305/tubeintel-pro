# Fixing the Onboarding Error

This document provides instructions to fix the error:
`Failed to update profile: Could not find the 'has_completed_onboarding' column of 'profiles' in the schema cache`

## The Problem

The error occurs because the onboarding page is trying to update a column called `has_completed_onboarding` in the `profiles` table, but this column does not exist in your Supabase database.

## The Solution

You need to add the missing column to your Supabase database. There are three ways to do this:

### Option 1: Run SQL in the Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the SQL below:

```sql
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
```

6. Click "Run" to execute the SQL
7. Refresh your application - the onboarding error should be fixed

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

1. Create a migration:
```bash
supabase migration new add_has_completed_onboarding_column
```

2. Paste the SQL code into the generated migration file

3. Apply the migration:
```bash
supabase db push
```

### Option 3: Using the API (Advanced)

If you prefer to apply the fix programmatically:

1. Install the required npm packages if not already installed:
```bash
npm install @supabase/supabase-js
```

2. Run the provided script:
```bash
node src/lib/apply-migration.cjs
```

## Verification

After applying any of these methods, the onboarding process should work without errors. The fix adds a `has_completed_onboarding` column to the `profiles` table and marks existing profiles with YouTube channel IDs as having completed onboarding.

## Prevention

To prevent similar issues in the future:
1. Use database migrations for all schema changes
2. Test schema changes locally before deploying
3. Consider using TypeScript interfaces that match your database schema 