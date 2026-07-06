import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secure-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';
import { cleanAfterLogin, cleanAfterLogout } from '@/utils/security-cleanup';

// Create a single supabase client for the entire app
// Handle cases where the environment variables might be missing
let supabase: ReturnType<typeof createClient>;

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials. Please check your environment variables.');
  }

  supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      }
    }
  );
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

    // Immediate cleanup of any localStorage tokens that Supabase might have created
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          localStorage.removeItem('sb:refresh_token');
          localStorage.removeItem('sb-auth-token');
        } catch (e) {
          console.warn('Failed immediate token cleanup:', e);
        }
      }, 100); // Small delay to catch async token creation
    }

    if (typeof window !== 'undefined') {
      // SECURITY: Do NOT store refresh token in localStorage
      // Clean up any existing auth tokens that might have been set
      try {
        localStorage.removeItem('sb:refresh_token');
        localStorage.removeItem('sb-auth-token');
      } catch (e) {
        console.warn('Failed to clean localStorage tokens:', e);
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
            // SECURITY: Do NOT store channel ID in localStorage
            // Use secure preferences for safe boolean flags only
            if (typeof window !== 'undefined') {
              secureStorage?.setPreference('hasYouTubeChannel', true);
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

    // SECURITY: Do NOT store user data in localStorage
    // Clean up any existing user data that might have been stored
    if (data.user && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('currentUserId');
        localStorage.removeItem(`user_${data.user.id}`);
        localStorage.removeItem('user');
        // Clean up any auth tokens that might have been created
        localStorage.removeItem('sb:refresh_token');
        localStorage.removeItem('sb-auth-token');
      } catch (e) {
        console.warn('Failed to clean localStorage during login:', e);
      }

      // Only store safe preferences
      secureStorage?.setPreference('lastLoginTime', Date.now());
    }

    // Use enhanced security cleanup after login
    cleanAfterLogin();

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

    // Clear any remaining localStorage items (including auth tokens)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('user_') ||
        key.startsWith('profile_') ||
        key === 'currentUserId' ||
        key === 'youtubeChannelId' ||
        key === 'user' ||
        key === 'sb:refresh_token' ||
        key === 'sb-auth-token'
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Additional cleanup with explicit token removal
    try {
      localStorage.removeItem('sb:refresh_token');
      localStorage.removeItem('sb-auth-token');
    } catch (e) {
      console.warn('Failed explicit token cleanup during logout:', e);
    }

    // Clear secure preferences related to user session
    secureStorage.setPreference('hasYouTubeChannel', false);
    secureStorage.clearAllPreferences();

    // Clear user cache
    clearUserCache();

    // Use enhanced security cleanup after logout
    cleanAfterLogout();

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
      let hasCompletedOnboarding = false;

      // Check if we have a safe preference cached
      const hasYouTubeChannel = secureStorage.getPreference('hasYouTubeChannel');
      if (hasYouTubeChannel) {
        hasCompletedOnboarding = true;
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
            // DON'T cache profile data in localStorage anymore - security risk
            // Just use the data directly without storing sensitive information

            if (profileData.youtube_channel_id) {
              hasCompletedOnboarding = true;
              // Store only a safe boolean flag, not the actual channel ID
              if (typeof window !== 'undefined') {
                secureStorage?.setPreference('hasYouTubeChannel', true);
              }
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

      // Don't store sensitive user data in localStorage anymore
      // Just keep the safe session preference
      secureStorage.setPreference('lastLoginTime', Date.now());

      // Update cache
      userCache = userData;
      userCacheTimestamp = Date.now();

      return userData;
    }

    // No Supabase auth and no cached user - user is not authenticated

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
    const { data: { session } } = await supabase.auth.getSession();
    return !!(session && session.user);
  } catch (error) {
    console.error('isAuthenticated error:', error);
    return false;
  }
};