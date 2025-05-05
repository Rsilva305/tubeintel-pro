# Complete Guide to Reset Supabase Authentication

If you need to completely reset your authentication in TubeIntel Pro, follow these steps:

## Step 1: Clear Local Storage in Browser

1. Open your browser's Developer Tools (F12 or right-click > Inspect)
2. Go to the Application tab
3. Select "Local Storage" in the left sidebar
4. Right-click on your site domain and select "Clear"
5. Close the Developer Tools

## Step 2: Reset Supabase Database and Users

1. Go to [https://app.supabase.com](https://app.supabase.com) and log in
2. Select your project
3. Reset database tables:
   - Go to SQL Editor > New Query
   - Copy and paste the contents of `src/lib/supabase-reset.sql`
   - Click "Run" to execute the SQL script

4. Delete existing users:
   - Go to Authentication > Users
   - Select all users you want to remove
   - Click "Delete User" and confirm

## Step 3: Configure Email Settings (If Emails Not Being Sent)

1. Go to Authentication > Providers
2. Scroll down to "Email"
3. Make sure "Enable Email Signup" is ON
4. If you're in development mode:
   - You can turn off "Confirm email" temporarily for testing
   - Or use a service like Mailtrap for testing emails

## Step 4: Check Environment Variables

1. Make sure your `.env.local` file contains the correct values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

2. Get these values from Supabase:
   - Go to Project Settings > API
   - Copy "Project URL" and "anon" public API key

## Step 5: Restart Development Server

1. Stop your existing server (Ctrl+C in terminal)
2. Delete the `.next` folder to clear any cached data:
   ```
   rm -rf .next
   ```
3. Restart the server:
   ```
   npm run dev
   ```

## Step 6: Test the Reset

1. Go to `http://localhost:3000` (or your app URL)
2. You should be redirected to the login page
3. Try signing up with a new account
4. Check your email for a confirmation link (if email confirmation is enabled)
5. Confirm your email and log in
6. You should now see the onboarding screen

## Using Demo Mode Instead

If you just want to test the app without dealing with Supabase:

1. Go to the login page
2. Click the "Demo Mode" toggle (top right of login card)
3. Enter any email/password
4. The app will work with mock data without requiring real authentication

## Troubleshooting

### No Confirmation Email
- Check your spam folder
- In Supabase, go to Authentication > Logs to see if emails are being sent
- Review your email provider settings in Supabase

### Login Loop Persists
- Try using Incognito/Private mode in your browser
- Check browser console for errors
- Verify API keys are correct in .env.local

### Database Not Created
- Check Supabase SQL Editor for errors
- Try running the SQL commands one by one
- Ensure you have the necessary permissions in your Supabase project 