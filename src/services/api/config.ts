// API Configuration file

// The YouTube API key 
// For production, use environment variables instead
export const YOUTUBE_API_KEY = 'AIzaSyBTNCNWyklQlWyDOYKGgJxfiaspBv4W-CM';

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
  // When in server-side rendering, default to false to avoid API calls
  if (!isBrowser) {
    return false;
  }
  
  // Check for environment variable first (highest priority)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_USE_REAL_API === 'true') {
    return true;
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
  
  // Save to localStorage for persistence across page refreshes
  if (isBrowser) {
    localStorage.setItem('useYoutubeApi', value ? 'true' : 'false');
  }
  
  return USE_YOUTUBE_API;
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

// For backward compatibility - this is what competitorsAdapter uses
export const getUseRealApi = () => {
  // Always return true for competitor lists functionality
  if (isBrowser && typeof window.location !== 'undefined' && 
      window.location.pathname.includes('/competitors')) {
    return true;
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
  return API_SETTINGS;
};

// Simulate API delay
export const simulateDelay = () => Promise.resolve(); 