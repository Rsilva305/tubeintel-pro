// API Configuration file

// The YouTube API key 
// For production, use environment variables instead
export const YOUTUBE_API_KEY = 'AIzaSyBTNCNWyklQlWyDOYKGgJxfiaspBv4W-CM';

// Application settings
let USE_REAL_API = false;
let API_SETTINGS = {
  simulateDelay: true,
  delayMs: 500
};

// Safely detect if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Functions to get and set the API mode
export const getUseRealApi = () => {
  // When this is called during server-side rendering, always return false
  // This ensures consistent rendering between server and client
  if (!isBrowser) {
    return false;
  }
  
  // On client-side, check localStorage
  const savedSetting = localStorage.getItem('useRealApi');
  if (savedSetting !== null) {
    USE_REAL_API = savedSetting === 'true';
  }
  
  return USE_REAL_API;
};

export const setUseRealApi = (value: boolean) => {
  USE_REAL_API = value;
  // Save to localStorage for persistence across page refreshes
  if (isBrowser) {
    localStorage.setItem('useRealApi', value ? 'true' : 'false');
  }
  return USE_REAL_API;
};

// DO NOT initialize during server-side rendering
// This was causing the hydration mismatch
if (isBrowser) {
  // This will run only on the client side after hydration
  const savedSetting = localStorage.getItem('useRealApi');
  if (savedSetting !== null) {
    USE_REAL_API = savedSetting === 'true';
  }
}

// Get API settings
export const getApiSettings = () => API_SETTINGS;

// Set API settings
export const setApiSettings = (settings: Partial<typeof API_SETTINGS>) => {
  API_SETTINGS = { ...API_SETTINGS, ...settings };
  return API_SETTINGS;
};

// Simulate API delay
export const simulateDelay = () => 
  API_SETTINGS.simulateDelay 
    ? new Promise((resolve) => setTimeout(resolve, API_SETTINGS.delayMs)) 
    : Promise.resolve(); 