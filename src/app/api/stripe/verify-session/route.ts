import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PRODUCTS } from '@/utils/stripe';

export async function GET(req: NextRequest) {
  try {
    // Get session_id from query string
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }
    
    // Verify with Stripe
    const stripe = getServerStripe();
    
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    // Get the session info from Stripe
    console.log('Retrieving Stripe session:', sessionId.substring(0, 10) + '...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 400 }
      );
    }
    
    // Check if the session was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }
    
    // Get the user ID from the session metadata
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;
    const authMethod = session.metadata?.authMethod || 'unknown';
    
    if (!userId || !planType) {
      return NextResponse.json(
        { success: false, error: 'Missing user information in session' },
        { status: 400 }
      );
    }
    
    // STRICT AUTHENTICATION: Verify the user is authenticated
    const supabase = createClient();
    const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
    
    // Default authentication state is unauthenticated
    let authenticatedUserId = null;
    let currentAuthMethod = 'none';
    
    // Check for session from Supabase client
    if (authSession && authSession.user) {
      authenticatedUserId = authSession.user.id;
      currentAuthMethod = 'supabase_session';
    } 
    // Fallback: Try to extract user directly from cookie if Supabase session fails
    else {
      const cookieStore = cookies();
      const authCookie = cookieStore.get('sb-auth-token');
      
      if (authCookie) {
        try {
          const authData = JSON.parse(authCookie.value);
          if (authData && authData.user) {
            authenticatedUserId = authData.user.id;
            currentAuthMethod = 'cookie_extraction';
            console.log('User extracted directly from cookie for verification');
          }
        } catch (parseError) {
          console.error('Failed to parse auth cookie:', parseError);
        }
      }
    }
    
    // If user is not authenticated with either method, return error and redirect to login
    if (!authenticatedUserId) {
      console.log('User not authenticated for subscription verification');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          redirectUrl: `/login?redirectTo=${encodeURIComponent(`/subscription/success?session_id=${sessionId}`)}`
        },
        { status: 401 }
      );
    }
    
    // Check if the authenticated user matches the one from the session metadata
    if (authenticatedUserId !== userId) {
      console.log('User ID mismatch: Session belongs to a different user');
      console.log(`Stripe session user: ${userId.substring(0, 8)}... vs Authenticated user: ${authenticatedUserId.substring(0, 8)}...`);
      
      return NextResponse.json(
        { success: false, error: 'User mismatch. This subscription belongs to another account.' },
        { status: 403 }
      );
    }
    
    // Format the subscription data
    const endDate = new Date();
    // Add 30 days for monthly subscription
    endDate.setDate(endDate.getDate() + 30);
    
    const subscriptionData = {
      id: session.subscription?.toString() || session.id,
      user_id: userId,
      plan_type: planType,
      status: 'active',
      created_at: new Date().toISOString(),
      current_period_end: endDate.toISOString(),
      price_id: planType === 'pro' ? PRODUCTS.PRO.priceId : PRODUCTS.PRO_PLUS.priceId
    };
    
    // Here you would normally store the subscription in your database
    console.log('Verified subscription:', {
      userId: userId.substring(0, 8) + '...',
      planType,
      subscriptionId: subscriptionData.id.substring(0, 10) + '...',
      authMethod: currentAuthMethod
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: subscriptionData
    });
    
  } catch (error: any) {
    console.error('Error verifying Stripe session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
} 