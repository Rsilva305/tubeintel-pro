import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  console.log('Subscription check endpoint called');
  
  try {
    // Create Supabase client with cookies
    const supabase = createClient();
    
    // Get the current user session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication error', details: error.message },
        { status: 401 }
      );
    }
    
    // Debug info about the session
    console.log('Auth check for subscription:', {
      hasSession: !!data.session,
      hasUser: data.session ? !!data.session.user : false,
      userId: data.session?.user?.id ? data.session.user.id.substring(0, 8) + '...' : 'none',
    });
    
    // If not authenticated, return error
    if (!data.session || !data.session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = data.session.user.id;
    
    // Check database for user's subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      // If error other than "not found"
      console.error('Error fetching subscription data:', subscriptionError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription data' },
        { status: 500 }
      );
    }
    
    // No subscription found
    if (!subscriptionData) {
      // Get from localStorage as fallback
      return NextResponse.json({
        success: true,
        subscription: {
          plan_type: 'free',
          status: 'none'
        }
      });
    }
    
    // Return the subscription data
    return NextResponse.json({
      success: true,
      subscription: {
        plan_type: subscriptionData.plan_type,
        status: subscriptionData.status,
        current_period_end: subscriptionData.current_period_end,
        created_at: subscriptionData.created_at
      }
    });
    
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred', details: error.message },
      { status: 500 }
    );
  }
} 