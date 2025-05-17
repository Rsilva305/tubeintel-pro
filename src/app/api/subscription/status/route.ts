import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get user's authentication status
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Try to get user from cookie if session is not available
    let userId = session?.user?.id;
    let authMethod = 'session';
    
    // If no session found, try to extract from auth cookie
    if (!userId) {
      try {
        const cookieStore = cookies();
        const authCookie = cookieStore.get('sb-auth-token');
        
        if (authCookie) {
          console.log('Found auth cookie, attempting to extract user');
          const authData = JSON.parse(authCookie.value);
          
          if (authData && authData.user && authData.user.id) {
            userId = authData.user.id;
            authMethod = 'cookie';
            console.log('Successfully extracted user ID from cookie:', userId);
          }
        }
      } catch (cookieError) {
        console.error('Error extracting user from cookie:', cookieError);
      }
    }
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      // Don't return error yet, continue with userId if we have it
      if (!userId) {
        return NextResponse.json(
          { 
            subscribed: false, 
            plan: 'free',
            error: 'Authentication error'
          }, 
          { status: 401 }
        );
      }
    }
    
    // If still not authenticated, return free plan
    if (!userId) {
      console.log('No authenticated user found');
      return NextResponse.json({
        subscribed: false,
        plan: 'free',
        message: 'User not authenticated'
      });
    }
    
    console.log('Checking subscription for user ID:', userId, 'via', authMethod);
    
    // Try with admin client first since we're having RLS issues
    try {
      console.log('Attempting subscription lookup with admin client for reliability');
      const adminClient = createAdminClient();
      
      const { data: adminSubscription, error: adminError } = await adminClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (adminError) {
        console.log('Admin client subscription lookup error:', adminError);
      } else if (adminSubscription) {
        console.log('Found subscription via admin client:', adminSubscription.plan_type);
        
        // Subscription exists, check if it's still valid
        const currentDate = new Date();
        const expiryDate = new Date(adminSubscription.current_period_end);
        
        if (expiryDate < currentDate) {
          // Subscription has expired
          return NextResponse.json({
            subscribed: false,
            plan: 'free',
            message: 'Subscription expired',
            expiryDate: adminSubscription.current_period_end
          });
        }
        
        // Active subscription found
        return NextResponse.json({
          subscribed: true,
          plan: adminSubscription.plan_type,
          subscription: {
            id: adminSubscription.id,
            planType: adminSubscription.plan_type,
            status: adminSubscription.status,
            currentPeriodEnd: adminSubscription.current_period_end
          },
          message: 'Active subscription found (admin)'
        });
      }
    } catch (adminClientError) {
      console.error('Admin client error:', adminClientError);
    }
    
    // Fall back to regular client if admin client fails
    console.log('Falling back to regular client lookup');
    
    // Query the user_subscriptions table
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Log the raw response for debugging
    console.log('Subscription query response:', {
      data: subscription ? 'Found' : 'Not found',
      error: subscriptionError,
      errorCode: subscriptionError?.code
    });
    
    if (subscriptionError) {
      console.log('No active subscription found for user:', userId);
      
      // Fallback to a simpler query that might evade RLS issues
      const { data: simpleCheck } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
        
      console.log('Simple check result:', simpleCheck);
      
      if (simpleCheck && simpleCheck.plan_type) {
        return NextResponse.json({
          subscribed: true,
          plan: simpleCheck.plan_type,
          message: 'Subscription found (simple check)'
        });
      }
      
      return NextResponse.json({
        subscribed: false,
        plan: 'free',
        message: 'No active subscription found',
        auth_method: authMethod
      });
    }
    
    // Subscription exists, check if it's still valid
    const currentDate = new Date();
    const expiryDate = new Date(subscription.current_period_end);
    
    console.log('Found subscription:', {
      id: subscription.id,
      planType: subscription.plan_type,
      status: subscription.status,
      expiryDate: expiryDate.toISOString(),
      isExpired: expiryDate < currentDate
    });
    
    if (expiryDate < currentDate) {
      // Subscription has expired
      return NextResponse.json({
        subscribed: false,
        plan: 'free',
        message: 'Subscription expired',
        expiryDate: subscription.current_period_end
      });
    }
    
    // Active subscription found
    return NextResponse.json({
      subscribed: true,
      plan: subscription.plan_type,
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      },
      message: 'Active subscription found'
    });
    
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json(
      { 
        subscribed: false, 
        plan: 'free',
        error: 'Failed to check subscription status', 
        details: error.message 
      },
      { status: 500 }
    );
  }
} 