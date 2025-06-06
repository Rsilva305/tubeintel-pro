import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

// Create a single supabase client for the entire app
// Handle cases where the environment variables might be missing
let supabase: ReturnType<typeof createClient>;

try {
  // Log environment variables for debugging (without exposing the full key)
  console.log("Client Supabase initialization:");
  console.log("- URL:", SUPABASE_URL ? SUPABASE_URL.substring(0, 15) + '...' : 'Missing');
  console.log("- Key:", SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 5) + '...' : 'Missing');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or anon key is missing. Authentication will not work properly.');
    throw new Error('Missing Supabase credentials. Please check your environment variables.');
  }
  
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Create the client with environment-appropriate auth configuration
  supabase = createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // Only use the custom storage in browser environments
        ...(isBrowser ? {
          storageKey: 'sb-auth-token',
          storage: {
            getItem: (key) => {
              const value = document.cookie
                .split('; ')
                .find((row) => row.startsWith(`${key}=`))
                ?.split('=')[1];
              return value ? decodeURIComponent(value) : null;
            },
            setItem: (key, value) => {
              document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
              // Backup to localStorage in case cookies fail
              try {
                localStorage.setItem(key, value);
              } catch (e) {
                console.warn('Failed to backup to localStorage:', e);
              }
            },
            removeItem: (key) => {
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.warn('Failed to remove from localStorage:', e);
              }
            }
          }
        } : {})
      }
    }
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
    // Log any existing cookies for debugging (browser-only)
    if (typeof window !== 'undefined') {
      console.log('Existing cookies before login:', document.cookie);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Debug cookies after login to verify they were set (browser-only)
    if (typeof window !== 'undefined') {
      console.log('Cookies after login:', document.cookie);
      
      // Store session refresh token in localStorage as backup for cookie issues
      if (data.session?.refresh_token) {
        try {
          localStorage.setItem('sb:refresh_token', data.session.refresh_token);
        } catch (e) {
          console.warn('Failed to set localStorage refresh token:', e);
        }
      }
    }
    
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
            if (typeof window !== 'undefined') {
              localStorage.setItem(`user_${data.user.id}_youtubeChannelId`, String(profileData.youtube_channel_id));
            }
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
    
    // Store the user in localStorage for easier access (browser-only)
    if (data.user && typeof window !== 'undefined') {
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

// Function to clear user cache
export const clearUserCache = () => {
  userCache = null;
  userCacheTimestamp = 0;
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
      localStorage.removeItem(`profile_${currentUserId}`);
      localStorage.removeItem(`profile_${currentUserId}_time`);
    }
    
    // Clear general localStorage items
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('youtubeChannelId'); // Remove legacy item too
    localStorage.removeItem('user'); // Remove legacy item too
    
    // Clear user cache
    clearUserCache();
    
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    return false;
  }
};

// Cache for getCurrentUser to prevent excessive database queries
let userCache: any = null;
let userCacheTimestamp = 0;
const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export const getCurrentUser = async (skipCache = false) => {
  try {
    // Use cache if available and not expired (unless skipCache is true)
    if (!skipCache && userCache && (Date.now() - userCacheTimestamp) < USER_CACHE_DURATION) {
      return userCache;
    }

    // First check with Supabase directly if the user is authenticated
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    
    // If we have a Supabase authenticated user, use that
    if (supabaseUser) {
      // Check if we have cached profile data in localStorage first
      const cachedProfile = localStorage.getItem(`profile_${supabaseUser.id}`);
      const cachedProfileTime = localStorage.getItem(`profile_${supabaseUser.id}_time`);
      
      let hasCompletedOnboarding = false;
      
      // Use cached profile if available and less than 5 minutes old
      if (cachedProfile && cachedProfileTime && 
          (Date.now() - parseInt(cachedProfileTime)) < USER_CACHE_DURATION) {
        const profileData = JSON.parse(cachedProfile);
        if (profileData.youtube_channel_id) {
          hasCompletedOnboarding = true;
          localStorage.setItem(`user_${supabaseUser.id}_youtubeChannelId`, String(profileData.youtube_channel_id));
        }
        if (profileData.has_completed_onboarding) {
          hasCompletedOnboarding = true;
        }
      } else {
        // Only fetch from database if cache is expired
        try {
          // Check if there's a profile with a YouTube channel ID
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('youtube_channel_id, has_completed_onboarding')
            .eq('id', supabaseUser.id)
            .single();
            
          if (!profileError && profileData) {
            // Cache the profile data
            localStorage.setItem(`profile_${supabaseUser.id}`, JSON.stringify(profileData));
            localStorage.setItem(`profile_${supabaseUser.id}_time`, Date.now().toString());
            
            if (profileData.youtube_channel_id) {
              hasCompletedOnboarding = true;
              localStorage.setItem(`user_${supabaseUser.id}_youtubeChannelId`, String(profileData.youtube_channel_id));
            }
            
            if (profileData.has_completed_onboarding) {
              hasCompletedOnboarding = true;
            }
          }
        } catch (profileError) {
          console.error('Error checking profile:', profileError);
        }
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
      
      // Update cache
      userCache = userData;
      userCacheTimestamp = Date.now();
      
      return userData;
    }
    
    // If no Supabase auth, check localStorage as fallback
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const storedUser = localStorage.getItem(`user_${currentUserId}`);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Update cache
        userCache = userData;
        userCacheTimestamp = Date.now();
        return userData;
      }
    }
    
    // No user found, clear cache
    userCache = null;
    userCacheTimestamp = 0;
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
    // First check the Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
      return true;
    }
    
    // Fallback to localStorage check (for development/demo purposes)
    const currentUserId = localStorage.getItem('currentUserId');
    const storedUser = currentUserId ? localStorage.getItem(`user_${currentUserId}`) : null;
    return !!storedUser;
  } catch (error) {
    console.error('isAuthenticated error:', error);
    return false;
  }
}; 