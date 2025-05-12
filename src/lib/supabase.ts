import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

// Create a single supabase client for the entire app
// Handle cases where the environment variables might be missing
let supabase: ReturnType<typeof createClient>;

try {
  // Log environment variables for debugging (without exposing the full key)
  console.log("Supabase initialization:");
  console.log("- URL:", SUPABASE_URL ? SUPABASE_URL.substring(0, 15) + '...' : 'Missing');
  console.log("- Key:", SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 5) + '...' : 'Missing');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or anon key is missing. Authentication will not work properly.');
    throw new Error('Missing Supabase credentials. Please check your environment variables.');
  }
  
  supabase = createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY
  );
  
  // Verify the client was created
  console.log("- Client initialized:", !!supabase);
  console.log("- Auth available:", !!supabase.auth);
  
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
}

export { supabase };

// Define the return type for signIn with hasCompletedOnboarding
interface SignInResult {
  user: any;
  session: any;
  hasCompletedOnboarding: boolean;
}

// Helper functions for authentication
export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<SignInResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Check if the user has a YouTube channel ID in their profile
    let hasCompletedOnboarding = false;
    
    if (data.user) {
      try {
        // Check if there's a profile with a YouTube channel ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('youtube_channel_id, has_completed_onboarding')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError && profileData) {
          if (profileData.youtube_channel_id) {
            hasCompletedOnboarding = true;
            // Store the channel ID in localStorage with user-specific key
            localStorage.setItem(`user_${data.user.id}_youtubeChannelId`, String(profileData.youtube_channel_id));
          }
          
          if (profileData.has_completed_onboarding) {
            hasCompletedOnboarding = true;
          }
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError);
        // Continue with sign in even if profile check fails
      }
    }
    
    // Store the user in localStorage for easier access
    if (data.user) {
      localStorage.setItem('currentUserId', data.user.id);
      localStorage.setItem(`user_${data.user.id}`, JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0] || 'user',
        createdAt: new Date().toISOString(),
        hasCompletedOnboarding: hasCompletedOnboarding
      }));
    }
    
    return {
      ...data,
      hasCompletedOnboarding
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    // Get current user ID before signing out
    const currentUserId = localStorage.getItem('currentUserId');
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear all user-specific localStorage items
    if (currentUserId) {
      localStorage.removeItem(`user_${currentUserId}`);
      localStorage.removeItem(`user_${currentUserId}_youtubeChannelId`);
    }
    
    // Clear general localStorage items
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('youtubeChannelId'); // Remove legacy item too
    localStorage.removeItem('user'); // Remove legacy item too
    
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    // First check with Supabase directly if the user is authenticated
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    // If we have a Supabase authenticated user, use that
    if (supabaseUser) {
      // Get profile data if needed
      let hasCompletedOnboarding = false;
      
      try {
        // Check if there's a profile with a YouTube channel ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('youtube_channel_id, has_completed_onboarding')
          .eq('id', supabaseUser.id)
          .single();
          
        if (!profileError && profileData) {
          if (profileData.youtube_channel_id) {
            hasCompletedOnboarding = true;
            // Store the channel ID in localStorage with user-specific key to prevent leaking between accounts
            localStorage.setItem(`user_${supabaseUser.id}_youtubeChannelId`, String(profileData.youtube_channel_id));
          }
          
          if (profileData.has_completed_onboarding) {
            hasCompletedOnboarding = true;
          }
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError);
      }
      
      // Format user data
      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        username: supabaseUser.email?.split('@')[0] || 'user',
        createdAt: supabaseUser.created_at || new Date().toISOString(),
        hasCompletedOnboarding: hasCompletedOnboarding
      };
      
      // Store in localStorage for easier access - with user ID
      localStorage.setItem('currentUserId', supabaseUser.id);
      localStorage.setItem(`user_${supabaseUser.id}`, JSON.stringify(userData));
      
      console.log("Using authenticated Supabase user:", supabaseUser.id);
      return userData;
    }
    
    // If no Supabase auth, check localStorage as fallback
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const storedUser = localStorage.getItem(`user_${currentUserId}`);
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper to get session
export const getSession = async () => {
  try {
    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // We have a user, so we're "authenticated" for our app purposes
      return { user: JSON.parse(storedUser) };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

// Function to check if user is logged in
export const isAuthenticated = async () => {
  try {
    // Check localStorage first for simplicity
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return true;
    }
    
    const session = await getSession();
    return !!session;
  } catch (error) {
    console.error('isAuthenticated error:', error);
    return false;
  }
}; 