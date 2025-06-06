import { apiCache, createCacheKey } from '@/lib/api-cache';
import { supabase } from '@/lib/supabase';
// Define CompetitorList interface locally since it's not exported from types
interface CompetitorList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  competitors: string[]; // Array of competitor IDs or YouTube channel IDs
  created_at: string;
  updated_at: string;
}

class OptimizedSupabaseService {
  private static instance: OptimizedSupabaseService;

  static getInstance(): OptimizedSupabaseService {
    if (!OptimizedSupabaseService.instance) {
      OptimizedSupabaseService.instance = new OptimizedSupabaseService();
    }
    return OptimizedSupabaseService.instance;
  }

  /**
   * Get user profile with caching
   */
  async getUserProfile(userId: string) {
    const cacheKey = createCacheKey('profile', userId);

    return apiCache.get(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      },
      'profile'
    );
  }

  /**
   * Get competitor lists with caching and localStorage fallback
   */
  async getCompetitorLists(userId: string): Promise<CompetitorList[]> {
    const cacheKey = createCacheKey('competitor_lists', userId);

    return apiCache.get(
      cacheKey,
      async () => {
        try {
          const { data, error } = await supabase
            .from('competitor_lists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Cache in localStorage as additional fallback
          if (data) {
            localStorage.setItem('competitor_lists', JSON.stringify(data));
          }

          return data || [];
        } catch (error) {
          console.error('Supabase error, using localStorage fallback:', error);
          
          // Fallback to localStorage
          const localData = localStorage.getItem('competitor_lists');
          if (localData) {
            return JSON.parse(localData);
          }
          
          throw error;
        }
      },
      'competitors'
    );
  }

  /**
   * Create competitor list with cache invalidation
   */
  async createCompetitorList(userId: string, listData: Omit<CompetitorList, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('competitor_lists')
      .insert({
        ...listData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    const cacheKey = createCacheKey('competitor_lists', userId);
    apiCache.invalidate(cacheKey);

    return data;
  }

  /**
   * Update competitor list with cache invalidation
   */
  async updateCompetitorList(userId: string, listId: string, updates: Partial<CompetitorList>) {
    const { data, error } = await supabase
      .from('competitor_lists')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    const cacheKey = createCacheKey('competitor_lists', userId);
    apiCache.invalidate(cacheKey);

    return data;
  }

  /**
   * Delete competitor list with cache invalidation
   */
  async deleteCompetitorList(userId: string, listId: string) {
    const { error } = await supabase
      .from('competitor_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);

    if (error) throw error;

    // Invalidate cache
    const cacheKey = createCacheKey('competitor_lists', userId);
    apiCache.invalidate(cacheKey);
  }

  /**
   * Batch operations for better performance
   */
  async batchUpdateCompetitorLists(userId: string, updates: Array<{ id: string; data: Partial<CompetitorList> }>) {
    // Perform all updates in parallel
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('competitor_lists')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
    );

    const results = await Promise.all(promises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Batch update failed: ${errors.map(e => e.error?.message).join(', ')}`);
    }

    // Invalidate cache
    const cacheKey = createCacheKey('competitor_lists', userId);
    apiCache.invalidate(cacheKey);

    return results.map(result => result.data);
  }

  /**
   * Get subscription data with optimized query
   */
  async getSubscriptionData(userId: string) {
    const cacheKey = createCacheKey('subscription_db', userId);

    return apiCache.get(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('plan_type, status, current_period_end, stripe_customer_id, stripe_subscription_id')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No subscription found
            return null;
          }
          throw error;
        }

        return data;
      },
      'subscription'
    );
  }

  /**
   * Invalidate all caches for a user (call on logout)
   */
  invalidateUserCaches(userId: string): void {
    apiCache.invalidate(`profile:${userId}`);
    apiCache.invalidate(`competitor_lists:${userId}`);
    apiCache.invalidate(`subscription_db:${userId}`);
  }

  /**
   * Preload critical data for faster initial page loads
   */
  async preloadUserData(userId: string): Promise<{
    profile: any;
    competitorLists: CompetitorList[];
    subscription: any;
  }> {
    // Run all queries in parallel
    const [profile, competitorLists, subscription] = await Promise.allSettled([
      this.getUserProfile(userId),
      this.getCompetitorLists(userId),
      this.getSubscriptionData(userId)
    ]);

    return {
      profile: profile.status === 'fulfilled' ? profile.value : null,
      competitorLists: competitorLists.status === 'fulfilled' ? competitorLists.value : [],
      subscription: subscription.status === 'fulfilled' ? subscription.value : null
    };
  }
}

// Export singleton instance
export const supabaseService = OptimizedSupabaseService.getInstance(); 