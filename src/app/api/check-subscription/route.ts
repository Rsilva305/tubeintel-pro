import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session, user is not authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          authenticated: false, 
          subscription: null,
          message: 'Not authenticated'
        },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get subscription from database
    const { data: subscriptionData, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription data:', error);
      return NextResponse.json(
        { 
          authenticated: true,
          subscription: null,
          error: 'Failed to retrieve subscription data'
        },
        { status: 500 }
      );
    }
    
    // If no subscription found, user is on free plan
    if (!subscriptionData) {
      return NextResponse.json({
        authenticated: true,
        subscription: {
          plan_type: 'free',
          status: 'active'
        }
      });
    }
    
    // Check if subscription is active
    const isActive = subscriptionData.status === 'active';
    const currentPeriodEnd = new Date(subscriptionData.current_period_end);
    const isExpired = currentPeriodEnd < new Date();
    
    return NextResponse.json({
      authenticated: true,
      subscription: {
        ...subscriptionData,
        is_active: isActive && !isExpired
      }
    });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        subscription: null,
        error: 'Failed to check subscription status'
      },
      { status: 500 }
    );
  }
} 