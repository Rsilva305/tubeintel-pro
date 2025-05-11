// This script helps debug and fix profile issues
import { supabase } from './supabase';

export async function checkProfile(userId) {
  try {
    console.log('Checking profile for user ID:', userId);
    
    // Count how many profile records exist for this user
    const { data: count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId);
      
    if (countError) {
      console.error('Error counting profiles:', countError);
      return { success: false, error: countError };
    }
    
    console.log('Number of profile records:', count);
    
    // Get all profiles for this user (for debugging)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { success: false, error: profilesError };
    }
    
    console.log('Profiles found:', profiles);
    
    return { 
      success: true, 
      count: count, 
      profiles: profiles 
    };
  } catch (error) {
    console.error('Exception checking profile:', error);
    return { success: false, error };
  }
}

export async function resetProfile(userId) {
  try {
    console.log('Resetting profile for user ID:', userId);
    
    // First delete any existing profiles for this user
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (deleteError) {
      console.error('Error deleting profiles:', deleteError);
      return { success: false, error: deleteError };
    }
    
    // Get user details to recreate profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return { success: false, error: userError };
    }
    
    // Create a new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        username: user.email?.split('@')[0] || null,
        youtube_channel_id: null
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log('New profile created:', newProfile);
    
    return { success: true, profile: newProfile };
  } catch (error) {
    console.error('Exception resetting profile:', error);
    return { success: false, error };
  }
}

// This function uses the service role admin approach (for emergency fixes)
export async function bypassSecurityProfileUpdate(userId, channelId) {
  try {
    console.log('Attempting to bypass RLS for profile update');
    
    // This function should call a secure API endpoint that uses the service role
    // For now, we'll implement a client-side approach with a warning
    console.warn('WARNING: Using client-side service role approach. This is not recommended for production.');
    
    // Get current profiles to see if we need to insert or update
    const { data: profiles, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
      
    if (findError) {
      throw new Error('Failed to find existing profiles: ' + findError.message);
    }
    
    let result;
    
    if (!profiles || profiles.length === 0) {
      // Need to get user details from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get user details: ' + userError.message);
      }
      
      // Create a profile with RLS bypassed via function
      const response = await fetch('/api/profile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          email: user.email,
          username: user.email?.split('@')[0] || null,
          youtubeChannelId: channelId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to create profile via API: ' + (errorData.error || response.statusText));
      }
      
      result = await response.json();
      console.log('Profile created via API bypass:', result);
    } else {
      // Update existing profile with RLS bypassed via function
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          youtubeChannelId: channelId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to update profile via API: ' + (errorData.error || response.statusText));
      }
      
      result = await response.json();
      console.log('Profile updated via API bypass:', result);
    }
    
    return { success: true, result };
  } catch (error) {
    console.error('Error bypassing security for profile update:', error);
    return { success: false, error: String(error) };
  }
} 