import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('=== DEBUG SUBSCRIPTION TEST ===');
    
    // Get authenticated user with fallback options
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Try to get user from session
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
    
    console.log('Current user ID:', userId || 'Not authenticated', '(via ' + authMethod + ')');
    
    // If not authenticated, return error
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        message: 'Please login to check subscription' 
      }, { status: 401 });
    }
    
    // Create admin client to bypass RLS
    const adminClient = createAdminClient();
    
    // Debug: Get all subscriptions in the table
    const { data: allSubs, error: allSubsError } = await adminClient
      .from('user_subscriptions')
      .select('*')
      .limit(10);
      
    if (allSubsError) {
      console.error('Error querying all subscriptions:', allSubsError);
      return NextResponse.json({ 
        error: 'Database error',
        message: allSubsError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${allSubs?.length || 0} total subscriptions in table`);
    
    // Get user's subscriptions
    const { data: userSubs, error: userSubsError } = await adminClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId);
      
    if (userSubsError) {
      console.error('Error querying user subscriptions:', userSubsError);
      return NextResponse.json({ 
        error: 'Database error',
        message: userSubsError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${userSubs?.length || 0} subscriptions for user ${userId}`);
    
    // Check RLS settings
    let rlsIssue = false;
    const { data: regUserSubs } = await supabase
      .from('user_subscriptions')
      .select('count')
      .eq('user_id', userId);
      
    if (!regUserSubs || (userSubs && userSubs.length > 0 && regUserSubs.length === 0)) {
      console.log('Possible RLS issue detected - admin can see subscriptions but regular client cannot');
      rlsIssue = true;
    }
    
    return NextResponse.json({
      message: 'Subscription debug information',
      authentication: {
        user_id: userId,
        auth_method: authMethod,
        is_authenticated: true
      },
      possible_rls_issue: rlsIssue,
      all_subscriptions_count: allSubs?.length || 0,
      user_subscriptions_count: userSubs?.length || 0,
      user_subscriptions: userSubs,
      all_subscriptions: allSubs,
      check_issues: {
        rls_configured: true,
        user_id_match: userSubs?.some(sub => sub.user_id === userId),
        active_subscription: userSubs?.some(sub => sub.status === 'active'),
        expired_subscription: userSubs?.some(sub => {
          const expiry = new Date(sub.current_period_end);
          return expiry < new Date();
        })
      }
    });
    
  } catch (error: any) {
    console.error('Error in debug subscription endpoint:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message 
    }, { status: 500 });
  }
} 