// This is a direct workaround for profile management without RLS policies
import { supabase } from './supabase';

// Get the current user ID from localStorage
function getCurrentUserId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('currentUserId');
}

// Store a channel ID directly in localStorage
export async function storeChannelId(channelId) {
  if (typeof window === 'undefined') return false;
  
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Cannot store channel ID: No current user ID found');
      return false;
    }
    
    // Store in user-specific localStorage for client-side access
    localStorage.setItem(`user_${userId}_youtubeChannelId`, channelId);
    
    // Also update the legacy key for backward compatibility
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
    const userId = getCurrentUserId();
    if (userId) {
      // Try to get from user-specific storage first
      const channelId = localStorage.getItem(`user_${userId}_youtubeChannelId`);
      if (channelId) return channelId;
    }
    
    // Fall back to legacy storage
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
    const userId = getCurrentUserId();
    if (userId) {
      localStorage.removeItem(`user_${userId}_youtubeChannelId`);
    }
    
    // Also clear legacy storage
    localStorage.removeItem('youtubeChannelId');
  } catch (error) {
    console.error('Error clearing stored channel ID:', error);
  }
} 