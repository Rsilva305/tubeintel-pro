import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { userId, youtubeChannelId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First check if profile exists
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
    
    // If profile doesn't exist, return an error
    if (!existingProfiles || existingProfiles.length === 0) {
      return NextResponse.json(
        { error: 'Profile does not exist. Use the create endpoint instead.' },
        { status: 400 }
      );
    }
    
    // Update profile with admin privileges
    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        youtube_channel_id: youtubeChannelId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 