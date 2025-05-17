import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/utils/stripe';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { PRODUCTS } from '@/utils/stripe';

export const dynamic = 'force-dynamic';

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
    
    // Generate a unique subscription ID that is UUID compatible
    // This will be used as the primary key in Supabase
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    // Create subscription data matching the table schema
    const subscriptionData = {
      id: generateUUID(), // Use UUID format for the primary key
      user_id: userId,
      plan_type: planType,
      status: 'active',
      created_at: new Date().toISOString(),
      current_period_end: endDate.toISOString(),
      stripe_subscription_id: session.subscription?.toString() || session.id, // Store the Stripe ID separately
      stripe_customer_id: session.customer?.toString() || null
    };
    
    // Store the subscription in Supabase using the admin client
    try {
      // Create admin client that bypasses RLS
      const adminClient = createAdminClient();
      
      // Check if this subscription already exists for this user
      const { data: existingSub, error: lookupError } = await adminClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (lookupError) {
        console.error('Error checking for existing subscription:', lookupError);
      }
      
      let dbOperation;
      if (existingSub) {
        // Update existing subscription
        dbOperation = await adminClient
          .from('user_subscriptions')
          .update({
            plan_type: subscriptionData.plan_type,
            status: subscriptionData.status,
            current_period_end: subscriptionData.current_period_end,
            stripe_subscription_id: subscriptionData.stripe_subscription_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id);
          
        console.log('Updated existing subscription in database');
      } else {
        // Insert new subscription
        dbOperation = await adminClient
          .from('user_subscriptions')
          .insert(subscriptionData);
          
        console.log('Inserted new subscription into database');
      }
      
      if (dbOperation.error) {
        console.error('Failed to save subscription to database:', dbOperation.error);
      } else {
        console.log('Successfully saved subscription to database');
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue with the flow - we still want to return success to the user
      // as the payment was successful, even if storing in DB failed
    }
    
    // Return success response with cleaner subscription data for the frontend
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        plan_type: subscriptionData.plan_type,
        current_period_end: subscriptionData.current_period_end,
        status: subscriptionData.status
      }
    });
    
  } catch (error: any) {
    console.error('Error verifying Stripe session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
} 