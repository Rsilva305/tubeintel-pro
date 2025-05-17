#!/bin/bash

# Script to fix the has_completed_onboarding column issue

# Check if SUPABASE_DB_URL is set
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL environment variable is not set."
  echo "Please set it with your Supabase database connection string."
  echo "You can find this in your Supabase dashboard under Project Settings > Database"
  echo "Example: export SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"
  exit 1
fi

# The SQL to fix the issue
SQL_FIX="
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
"

echo "Applying fix for the has_completed_onboarding column..."

# Check if psql is installed
if command -v psql >/dev/null 2>&1; then
  # Execute the SQL using psql
  echo "$SQL_FIX" | psql "$SUPABASE_DB_URL"
  
  if [ $? -eq 0 ]; then
    echo "Fix applied successfully!"
    echo "Your onboarding page should now work correctly."
  else
    echo "Error applying the fix. Please try running the SQL manually."
  fi
else
  echo "psql command not found. Please install PostgreSQL client or run the SQL manually."
  echo "You can find the SQL in: src/lib/fix-onboarding.sql"
fi 