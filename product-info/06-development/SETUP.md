# Fixing Authentication in TubeIntel Pro

This guide will help you set up proper authentication in your TubeIntel Pro application using Supabase.

## Problem Overview

You're experiencing the following issues:
1. Users can sign up but don't see a database table in Supabase
2. Login keeps redirecting back to the login page

## Step 1: Create Database Tables in Supabase

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor (left sidebar)
4. Click "New Query"
5. Copy and paste the SQL from the `src/lib/supabase-setup.sql` file we created
6. Click "Run" to execute the SQL

This creates:
- A `profiles` table linked to Supabase Auth users
- Row-level security policies for data protection
- A trigger to create a profile when a new user signs up

## Step 2: Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`
2. Fill in your Supabase credentials:
   - Go to your Supabase project settings > API
   - Copy the "Project URL" to `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Save the file

## Step 3: Restart Your Development Server

```bash
npm run dev
```

## Step 4: Testing Authentication

1. Try signing up a new user using the signup form
2. Check Supabase Authentication > Users to see if the user was created
3. Check the Database > Table editor > profiles to confirm a profile was created
4. Try logging in with the user credentials

## Troubleshooting

If you're still experiencing issues:

### Login Redirect Loop

This happens when the authentication state isn't being properly maintained. Possible solutions:

1. Clear your browser's local storage: 
   - Open Developer Tools (F12)
   - Go to Application > Local Storage
   - Clear the items for your domain

2. Check browser console for errors during login

3. Verify your Supabase URL and ANON_KEY are correct in .env.local

### No Database Tables

If user accounts are created but no profiles exist:

1. Make sure you ran the SQL script correctly
2. Check Supabase logs for any errors (in SQL Editor > Logs)
3. Try manually creating a profile for a test user

## Demo Mode

If you want to test the app without Supabase:

1. Click the "Demo Mode" toggle on the login page
2. Enter any email and password to login
3. The app will use mock data and localStorage for authentication

## Production Considerations

For a production app, we recommend:
- Setting up proper email confirmation
- Adding password reset functionality
- Setting up stronger security policies
- Configure a secure authentication flow with OAuth providers 