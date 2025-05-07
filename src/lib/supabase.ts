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
          .select('youtube_channel_id')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError && profileData && profileData.youtube_channel_id) {
          hasCompletedOnboarding = true;
          // Store the channel ID in localStorage for easier access
          localStorage.setItem('youtubeChannelId', profileData.youtube_channel_id.toString());
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError);
        // Continue with sign in even if profile check fails
      }
    }
    
    // Store the user in localStorage for easier access
    if (data.user) {
      localStorage.setItem('user', JSON.stringify({
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
    // Always remove from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('youtubeChannelId');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    // Check localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // If user exists in Supabase but not in localStorage, store it
    if (user && !storedUser) {
      let hasCompletedOnboarding = false;
      
      try {
        // Check if there's a profile with a YouTube channel ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('youtube_channel_id')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData && profileData.youtube_channel_id) {
          hasCompletedOnboarding = true;
          // Store the channel ID in localStorage for easier access
          localStorage.setItem('youtubeChannelId', profileData.youtube_channel_id.toString());
        }
      } catch (profileError) {
        console.error('Error checking profile:', profileError);
      }
      
      const userData = {
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0] || 'user',
        createdAt: user.created_at || new Date().toISOString(),
        hasCompletedOnboarding: hasCompletedOnboarding
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
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