/**
 * Manual Security Cleanup Utility
 * For immediate cleanup of identified security violations
 */

export const manualSecurityCleanup = () => {
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }

  console.log('🔒 Starting manual security cleanup...');
  
  // List of specific violations to clean up
  const violationsToRemove = [
    'sb-auth-token',
    'sb:refresh_token',
    // Profile data patterns
    /^profile_[a-f0-9-]+$/,
    /^profile_[a-f0-9-]+_time$/,
    // User data patterns  
    /^user_[a-f0-9-]+$/,
    /^user_[a-f0-9-]+_youtubeChannelId$/,
    // Other sensitive patterns
    'currentUserId',
    'youtubeChannelId',
    'api_usage_logs' // This contains user activity data
  ];

  const removedItems: string[] = [];
  const currentItems: string[] = [];

  // Get all current localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      currentItems.push(key);
    }
  }

  console.log(`📊 Found ${currentItems.length} items in localStorage:`, currentItems);

  // Remove violations
  currentItems.forEach(key => {
    const shouldRemove = violationsToRemove.some(pattern => {
      if (typeof pattern === 'string') {
        return key === pattern;
      } else {
        // It's a regex
        return pattern.test(key);
      }
    });

    if (shouldRemove) {
      const value = localStorage.getItem(key);
      console.log(`🗑️ Removing: ${key} = ${value?.substring(0, 50)}...`);
      localStorage.removeItem(key);
      removedItems.push(key);
    }
  });

  // Also clear sessionStorage of sensitive data
  const sessionItems: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && !key.startsWith('temp_')) {
      sessionItems.push(key);
      sessionStorage.removeItem(key);
    }
  }

  console.log(`✅ Security cleanup complete!`);
  console.log(`📤 Removed ${removedItems.length} localStorage items:`, removedItems);
  console.log(`📤 Cleared ${sessionItems.length} sessionStorage items:`, sessionItems);

  // Verify cleanup
  const remainingItems: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      remainingItems.push(key);
    }
  }

  console.log(`📋 Remaining localStorage items (${remainingItems.length}):`, remainingItems);

  return {
    removed: removedItems,
    sessionCleared: sessionItems,
    remaining: remainingItems
  };
};

// Auto-add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).manualSecurityCleanup = manualSecurityCleanup;
} 