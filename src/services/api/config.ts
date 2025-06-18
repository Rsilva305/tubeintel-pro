// API Configuration file

// Application settings
let USE_YOUTUBE_API = true; // Default to using YouTube API
let API_SETTINGS = {
  simulateDelay: false,
  delayMs: 0
};

// Safely detect if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Functions to get and set the API mode
export const getUseYoutubeApi = () => {
  // Check for environment variable first (highest priority)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USE_REAL_API === 'true') {
    return true;
  }
  
  // In production, always use real API unless explicitly disabled
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return true;
  }
  
  // When in server-side rendering, check if we have API key configured
  if (!isBrowser) {
    // If we have YouTube API key configured, use real API
    const hasYouTubeKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.SERVER_YOUTUBE_API_KEY;
    if (hasYouTubeKey) {
      return true;
    }
    // Default to false only if no API key is configured on server-side
    return false;
  }
  
  // On client-side, check localStorage
  const savedSetting = localStorage.getItem('useYoutubeApi');
  if (savedSetting !== null) {
    USE_YOUTUBE_API = savedSetting === 'true';
  }
  
  return USE_YOUTUBE_API;
};

export const setUseYoutubeApi = (value: boolean) => {
  USE_YOUTUBE_API = value;
  if (isBrowser) {
    localStorage.setItem('useYoutubeApi', value.toString());
  }
};

// Initialize during client-side only
if (isBrowser) {
  // This will run only on the client side after hydration
  // Check for environment variable first
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USE_REAL_API === 'true') {
    USE_YOUTUBE_API = true;
    localStorage.setItem('useYoutubeApi', 'true');
  } else {
    const savedSetting = localStorage.getItem('useYoutubeApi');
    if (savedSetting !== null) {
      USE_YOUTUBE_API = savedSetting === 'true';
    } else {
      // If no setting exists, always default to true and save it
      localStorage.setItem('useYoutubeApi', 'true');
    }
  }
}

// Function to always use real API for competitor lists
export const useRealApiForCompetitors = () => {
  // Always return true for competitor lists, regardless of API toggle state
  return true;
};

// For backward compatibility - this is what competitorsAdapter uses
export const getUseRealApi = () => {
  // Always use real API for competitor functionality, regardless of path
  if (useRealApiForCompetitors()) {
    return true;
  }
  
  // Log the current path for debugging
  if (isBrowser && typeof window.location !== 'undefined') {
    console.log("Current path for API mode check:", window.location.pathname);
  }
  
  // Otherwise fallback to the YouTube API setting
  return getUseYoutubeApi();
};

export const setUseRealApi = setUseYoutubeApi;

// Get API settings
export const getApiSettings = () => API_SETTINGS;

// Set API settings
export const setApiSettings = (settings: Partial<typeof API_SETTINGS>) => {
  API_SETTINGS = { ...API_SETTINGS, ...settings };
};

// Simulate API delay
export const simulateDelay = () => Promise.resolve(); 