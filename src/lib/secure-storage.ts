/**
 * Secure Storage Utility
 * Handles data storage with security best practices for SaaS applications
 */

// Define what's safe to store in localStorage vs what needs server-side storage
interface SafeLocalStorageData {
  // UI preferences (non-sensitive)
  theme?: 'light' | 'dark';
  language?: string;
  sidebarCollapsed?: boolean;
  dashboardLayout?: string;
  
  // Cache metadata (timestamps only, no actual data)
  lastApiCacheUpdate?: number;
  cacheVersion?: string;
  
  // Anonymous analytics (no PII)
  sessionStartTime?: number;
  pageViewCount?: number;
  featureFlagsCache?: Record<string, boolean>;
  lastLoginTime?: number;
  securityMigrationCompleted?: boolean;
}

interface SessionData {
  // Temporary, non-sensitive data for current session only
  currentPage?: string;
  formDrafts?: Record<string, any>; // Non-sensitive form data only
  tempUIState?: any;
}

// Items that should NEVER be stored client-side
const FORBIDDEN_KEYS = [
  'password',
  'token',
  'refresh_token',
  'session',
  'api_key',
  'secret',
  'youtube_channel_id', // Business sensitive
  'email', // PII
  'user_id', // PII
  'profile', // Contains PII
];

class SecureStorage {
  private static instance: SecureStorage;
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Safe localStorage operations for non-sensitive data only
   */
  setPreference<K extends keyof SafeLocalStorageData>(
    key: K, 
    value: SafeLocalStorageData[K]
  ): void {
    if (typeof window === 'undefined') return;
    
    try {
      const prefixedKey = `pref_${key}`;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save preference:', key, error);
    }
  }

  getPreference<K extends keyof SafeLocalStorageData>(
    key: K
  ): SafeLocalStorageData[K] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const prefixedKey = `pref_${key}`;
      const value = localStorage.getItem(prefixedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to read preference:', key, error);
      return null;
    }
  }

  /**
   * SessionStorage for temporary, non-sensitive data
   */
  setSessionData<K extends keyof SessionData>(
    key: K, 
    value: SessionData[K]
  ): void {
    if (typeof window === 'undefined') return;
    
    try {
      const prefixedKey = `temp_${key}`;
      sessionStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save session data:', key, error);
    }
  }

  getSessionData<K extends keyof SessionData>(
    key: K
  ): SessionData[K] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const prefixedKey = `temp_${key}`;
      const value = sessionStorage.getItem(prefixedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to read session data:', key, error);
      return null;
    }
  }

  /**
   * Security audit - check for forbidden data in storage
   */
  auditStorage(): {
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    if (typeof window === 'undefined') {
      return { violations, recommendations };
    }

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const lowerKey = key.toLowerCase();
      const violation = FORBIDDEN_KEYS.find(forbidden => 
        lowerKey.includes(forbidden)
      );

      if (violation) {
        violations.push(`localStorage contains risky key: ${key}`);
      }
    }

    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;

      const lowerKey = key.toLowerCase();
      const violation = FORBIDDEN_KEYS.find(forbidden => 
        lowerKey.includes(forbidden)
      );

      if (violation) {
        violations.push(`sessionStorage contains risky key: ${key}`);
      }
    }

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Move sensitive data to httpOnly cookies');
      recommendations.push('Use server-side session management');
      recommendations.push('Implement proper authentication flow');
      recommendations.push('Clear existing sensitive localStorage data');
    }

    return { violations, recommendations };
  }

  /**
   * Clean up sensitive data from storage
   */
  cleanupSensitiveData(): void {
    if (typeof window === 'undefined') return;

    const itemsToRemove: string[] = [];

    // Check localStorage for sensitive data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const lowerKey = key.toLowerCase();
      const isSensitive = FORBIDDEN_KEYS.some(forbidden => 
        lowerKey.includes(forbidden)
      );

      if (isSensitive) {
        itemsToRemove.push(key);
      }
    }

    // Remove sensitive items
    itemsToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔒 Removed sensitive data: ${key}`);
    });

    if (itemsToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${itemsToRemove.length} sensitive localStorage items`);
    }
  }

  /**
   * Get all current preferences (safe to display in UI)
   */
  getAllPreferences(): SafeLocalStorageData {
    const preferences: SafeLocalStorageData = {};
    
    const keys: (keyof SafeLocalStorageData)[] = [
      'theme', 'language', 'sidebarCollapsed', 'dashboardLayout',
      'lastApiCacheUpdate', 'cacheVersion', 'sessionStartTime', 
      'pageViewCount', 'featureFlagsCache'
    ];

    keys.forEach(key => {
      const value = this.getPreference(key);
      if (value !== null) {
        (preferences as any)[key] = value;
      }
    });

    return preferences;
  }

  /**
   * Clear all preferences (for logout or reset)
   */
  clearAllPreferences(): void {
    if (typeof window === 'undefined') return;

    const prefKeys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pref_')) {
        prefKeys.push(key);
      }
    }

    prefKeys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    console.log('🗑️ Cleared all user preferences and session data');
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Security recommendations for your SaaS
export const securityRecommendations = {
  authentication: [
    'Use httpOnly cookies for session tokens',
    'Implement CSRF protection',
    'Use secure, sameSite cookie flags',
    'Set proper cookie expiration times'
  ],
  
  dataStorage: [
    'Never store passwords or API keys client-side',
    'Minimize PII in localStorage',
    'Use server-side sessions for sensitive data',
    'Implement proper logout that clears all data'
  ],
  
  implementation: [
    'Replace current localStorage usage with secureStorage',
    'Move user authentication to httpOnly cookies',
    'Store YouTube channel data server-side only',
    'Use encrypted database for all sensitive data'
  ]
};

// Development helper
export const runSecurityAudit = () => {
  const audit = secureStorage.auditStorage();
  
  console.group('🔒 Security Audit Results');
  
  if (audit.violations.length > 0) {
    console.warn('⚠️ Security Violations Found:');
    audit.violations.forEach(violation => console.warn('  -', violation));
  } else {
    console.log('✅ No security violations found');
  }
  
  if (audit.recommendations.length > 0) {
    console.info('💡 Recommendations:');
    audit.recommendations.forEach(rec => console.info('  -', rec));
  }
  
  console.groupEnd();
  
  return audit;
}; 