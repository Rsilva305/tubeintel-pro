# Fixing the "Failed to update profile" Error in TubeIntel Pro

If you're seeing the error "Failed to update profile: new row violates row-level security policy for table 'profiles'" when trying to connect a YouTube channel, this guide will help you fix it.

## What Caused This Error?

The error occurs because:

1. Supabase is using Row Level Security (RLS) policies to protect your database
2. The "profiles" table is missing the necessary RLS policies that would allow users to create or update their own profiles

## Solution 1: Add RLS Policies in Supabase (Recommended)

The best solution is to add the missing RLS policies:

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the SQL from `src/lib/profile-fix.sql`
5. Run the query
6. Return to your app and try connecting a channel again

## Solution 2: Use the Profile Debugger

We've added a Profile Debugger utility to help fix these issues:

1. Go to the Settings page in TubeIntel Pro
2. Scroll to the bottom and click "Debug Profile Issues"
3. Try the "Reset Profile" button, which will delete and recreate your profile
4. If that doesn't work, you can try the "Emergency Bypass" option (requires additional setup)

## Solution 3: Set Up the Emergency Bypass (Advanced)

If the other methods don't work, you can use the emergency bypass, which requires setting up your service role key:

1. Get your service role key from Supabase:
   - Go to your Supabase project
   - Go to Project Settings > API
   - Find the "service_role key" (this is different from the anon key)
   - Copy it

2. Add the key to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Restart your development server
4. Go to Settings > Debug Profile Issues
5. Use the Emergency Bypass option

## Preventing This Issue in the Future

To prevent this issue from happening again:

1. Make sure your Supabase setup includes all necessary RLS policies
2. When adding new tables, always define appropriate RLS policies
3. Consider using database migrations to manage your schema changes

## Need More Help?

If you continue to have issues, check the Supabase documentation on Row Level Security:
https://supabase.com/docs/guides/auth/row-level-security 