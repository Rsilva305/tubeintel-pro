// This is a direct workaround for profile management without RLS policies
import { supabase } from './supabase';

// Store a channel ID directly in localStorage
export async function storeChannelId(channelId) {
  if (typeof window === 'undefined') return false;
  
  try {
    // Store in localStorage for client-side access
    localStorage.setItem('youtubeChannelId', channelId);
    console.log('Stored channel ID in localStorage:', channelId);
    return true;
  } catch (error) {
    console.error('Error storing channel ID:', error);
    return false;
  }
}

// Get the stored channel ID
export function getStoredChannelId() {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('youtubeChannelId');
  } catch (error) {
    console.error('Error getting stored channel ID:', error);
    return null;
  }
}

// Check if a channel ID is stored
export function hasStoredChannelId() {
  return !!getStoredChannelId();
}

// Clear the stored channel ID
export function clearStoredChannelId() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('youtubeChannelId');
  } catch (error) {
    console.error('Error clearing stored channel ID:', error);
  }
} 