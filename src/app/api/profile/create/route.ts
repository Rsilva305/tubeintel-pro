import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from '@/lib/env';

// We need to get the service role key from environment variables
// This should be kept secure and only used server-side
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use the service role key for admin privileges
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  try {
    const { userId, email, username, youtubeChannelId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First check if profile already exists
    const { data: existingProfiles, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId);
      
    if (findError) {
      console.error('Error checking for existing profile:', findError);
      return NextResponse.json(
        { error: `Failed to check for existing profile: ${findError.message}` },
        { status: 500 }
      );
    }
    
    // If profile already exists, return an error (use update endpoint instead)
    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { error: 'Profile already exists. Use the update endpoint instead.' },
        { status: 400 }
      );
    }
    
    // Create new profile with admin privileges
    const { data: profile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        username: username,
        youtube_channel_id: youtubeChannelId
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json(
        { error: `Failed to create profile: ${insertError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Unexpected error creating profile:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 