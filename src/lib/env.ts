// Helper to get environment variables safely
export const getEnv = (key: string, defaultValue: string = ''): string => {
  // Check for browser environment variables (Next.js prefixed with NEXT_PUBLIC_)
  const value = process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  
  // In development, log when important environment variables are missing
  if (process.env.NODE_ENV === 'development' && !value && !defaultValue) {
    console.warn(`Warning: Environment variable NEXT_PUBLIC_${key} is missing`);
  }
  
  return value;
};

// Environment variables with fallbacks
// In production, these would be set in the real environment or .env.local file

// Use environment variables if available, otherwise fallback to defaults
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// YouTube API key for real API calls
// Load from environment variable or use fallback for development
export const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyBTNCNWyklQlWyDOYKGgJxfiaspBv4W-CM';

// Helper to check if Supabase environment variables are properly set
export const hasSupabaseConfig = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Helper to check if YouTube API key is set
export const hasYouTubeApiKey = !!YOUTUBE_API_KEY;

// Export a function to check if we can use real authentication
export const canUseRealAuth = () => {
  return hasSupabaseConfig;
};

// Export a function to get environment information for debugging
export const getEnvironmentInfo = () => {
  return {
    hasSupabaseConfig,
    hasYouTubeApiKey,
    isProduction: process.env.NODE_ENV === 'production',
    supabaseUrl: SUPABASE_URL ? 'Set' : 'Not set',
    supabaseKey: SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    youtubeApiKey: YOUTUBE_API_KEY ? 'Set' : 'Not set'
  };
}; 