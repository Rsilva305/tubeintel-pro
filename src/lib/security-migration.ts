/**
 * Security Migration Utility
 * Helps transition users from legacy localStorage authentication to secure authentication
 */

import { secureStorage } from './secure-storage';
import { secureAuth } from './secure-auth';

interface MigrationResult {
  migrated: boolean;
  clearedSensitiveData: boolean;
  legacyDataFound: string[];
  warnings: string[];
}

class SecurityMigration {
  private static instance: SecurityMigration;

  static getInstance(): SecurityMigration {
    if (!SecurityMigration.instance) {
      SecurityMigration.instance = new SecurityMigration();
    }
    return SecurityMigration.instance;
  }

  /**
   * Run automatic migration for existing users
   */
  async runMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
      migrated: false,
      clearedSensitiveData: false,
      legacyDataFound: [],
      warnings: []
    };

    if (typeof window === 'undefined') {
      return result;
    }

    try {
      // 1. Detect legacy data
      const legacyData = this.detectLegacyData();
      result.legacyDataFound = legacyData.keys;

      if (legacyData.keys.length > 0) {
        console.log('🔍 Security Migration: Found legacy authentication data');
        
        // 2. Check if user is still authenticated via Supabase
        const isAuthenticated = await secureAuth.isAuthenticated();
        
        if (isAuthenticated) {
          // User is authenticated - safe to clean up legacy data
          console.log('✅ User is authenticated - migrating to secure storage');
          
          // 3. Migrate safe preferences
          this.migrateSafePreferences(legacyData.safeData);
          
          // 4. Clean up sensitive data
          this.cleanupSensitiveData(legacyData.sensitiveKeys);
          result.clearedSensitiveData = true;
          
          // 5. Set migration flag
          secureStorage.setPreference('securityMigrationCompleted', true);
          result.migrated = true;
          
          console.log('🎉 Security migration completed successfully');
        } else {
          // User not authenticated - just clean up and warn
          result.warnings.push('User not authenticated - cleaning up legacy data only');
          this.cleanupSensitiveData(legacyData.sensitiveKeys);
          result.clearedSensitiveData = true;
        }
      }

      return result;
    } catch (error) {
      console.error('Security migration error:', error);
      result.warnings.push(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Check if migration has been completed
   */
  isMigrationCompleted(): boolean {
    return !!secureStorage.getPreference('securityMigrationCompleted');
  }

  /**
   * Force clean all sensitive data (for manual cleanup)
   */
  forceCleanup(): string[] {
    const cleaned: string[] = [];
    
    if (typeof window === 'undefined') {
      return cleaned;
    }

    const sensitivePatterns = [
      'token', 'refresh_token', 'session', 'password', 'api_key', 'secret',
      'youtube_channel_id', 'email', 'user_id', 'profile', 'user_', 'profile_'
    ];

    // Clean localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isSensitive = sensitivePatterns.some(pattern => 
        key.toLowerCase().includes(pattern)
      );

      if (isSensitive && !key.startsWith('pref_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleaned.push(key);
    });

    console.log(`🧹 Force cleanup removed ${cleaned.length} sensitive items`);
    return cleaned;
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): {
    currentRisks: string[];
    recommendations: string[];
    migrationStatus: string;
    lastMigration?: number;
  } {
    const legacyData = this.detectLegacyData();
    const isMigrated = this.isMigrationCompleted();
    
    return {
      currentRisks: legacyData.sensitiveKeys,
      recommendations: this.getSecurityRecommendations(legacyData.sensitiveKeys.length > 0),
      migrationStatus: isMigrated ? 'completed' : 'pending',
      lastMigration: secureStorage.getPreference('lastLoginTime') || undefined
    };
  }

  // Private methods
  private detectLegacyData(): {
    keys: string[];
    sensitiveKeys: string[];
    safeData: Record<string, string>;
  } {
    const keys: string[] = [];
    const sensitiveKeys: string[] = [];
    const safeData: Record<string, string> = {};

    if (typeof window === 'undefined') {
      return { keys, sensitiveKeys, safeData };
    }

    const sensitivePatterns = [
      'token', 'refresh_token', 'session', 'password', 'api_key', 'secret',
      'youtube_channel_id', 'email', 'user_id', 'profile', 'user_', 'profile_'
    ];

    const safePatterns = [
      'theme', 'language', 'sidebar', 'layout', 'preference'
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      keys.push(key);

      const lowerKey = key.toLowerCase();
      const isSensitive = sensitivePatterns.some(pattern => lowerKey.includes(pattern));
      const isSafe = safePatterns.some(pattern => lowerKey.includes(pattern));

      if (isSensitive && !key.startsWith('pref_')) {
        sensitiveKeys.push(key);
      } else if (isSafe) {
        const value = localStorage.getItem(key);
        if (value) {
          safeData[key] = value;
        }
      }
    }

    return { keys, sensitiveKeys, safeData };
  }

  private migrateSafePreferences(safeData: Record<string, string>): void {
    Object.entries(safeData).forEach(([key, value]) => {
      try {
        // Try to migrate to new secure storage format
        if (key.includes('theme')) {
          secureStorage.setPreference('theme', value === 'dark' ? 'dark' : 'light');
        } else if (key.includes('language')) {
          secureStorage.setPreference('language', value);
        } else if (key.includes('sidebar')) {
          secureStorage.setPreference('sidebarCollapsed', value === 'true');
        }
        // Remove old key after migration
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to migrate preference ${key}:`, error);
      }
    });
  }

  private cleanupSensitiveData(sensitiveKeys: string[]): void {
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🔒 Removed sensitive data: ${key}`);
    });

    // Also clear sessionStorage of sensitive data
    const sessionKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !key.startsWith('temp_')) {
        sessionKeys.push(key);
      }
    }

    sessionKeys.forEach(key => sessionStorage.removeItem(key));
  }

  private getSecurityRecommendations(hasRisks: boolean): string[] {
    const recommendations = [
      'Use secure authentication with httpOnly cookies',
      'Store only non-sensitive preferences in localStorage',
      'Implement proper logout that clears all client data',
      'Regular security audits of client-side storage'
    ];

    if (hasRisks) {
      recommendations.unshift('Immediately clean up sensitive data from localStorage');
      recommendations.push('Consider forcing all users to re-authenticate');
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityMigration = SecurityMigration.getInstance();

// Auto-run migration on import (in browser only)
if (typeof window !== 'undefined') {
  // Run migration after a short delay to avoid blocking initial render
  setTimeout(() => {
    securityMigration.runMigration().then(result => {
      if (result.migrated) {
        console.log('✅ Security migration completed');
      } else if (result.clearedSensitiveData) {
        console.log('🧹 Cleaned up sensitive data');
      }
    }).catch(error => {
      console.error('Security migration failed:', error);
    });
  }, 1000);
} 