import { supabase } from '@/lib/supabase';

export type SubscriptionStatus = 'free' | 'pro' | 'pro-plus';

interface UserSubscription {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing';
  plan_type: SubscriptionStatus;
  current_period_end: string;
  created_at: string;
}

/**
 * Get the current user's subscription status
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  if (!userId) {
    console.error('getUserSubscription: No user ID provided');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Ensure the data has all required fields
    if (
      'status' in data && 
      'plan_type' in data && 
      'current_period_end' in data &&
      'created_at' in data
    ) {
      return data as UserSubscription;
    }
    
    console.error('Subscription data missing required fields:', data);
    return null;
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Check if the user has an active subscription
 */
export function hasActiveSubscription(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  // Check if subscription is active
  if (subscription.status !== 'active') return false;
  
  // Check if subscription has expired
  const periodEnd = new Date(subscription.current_period_end);
  const now = new Date();
  
  return periodEnd > now;
}

/**
 * Get user subscription plan type
 */
export function getUserPlanType(subscription: UserSubscription | null): SubscriptionStatus {
  if (!subscription || !hasActiveSubscription(subscription)) {
    return 'free';
  }
  
  return subscription.plan_type;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  feature: 'basic' | 'pro' | 'pro-plus',
  subscription: UserSubscription | null
): boolean {
  const planType = getUserPlanType(subscription);
  
  switch (feature) {
    case 'basic':
      // All plans have access to basic features
      return true;
    case 'pro':
      // Pro and Pro+ plans have access to pro features
      return planType === 'pro' || planType === 'pro-plus';
    case 'pro-plus':
      // Only Pro+ has access to pro-plus features
      return planType === 'pro-plus';
    default:
      return false;
  }
} 