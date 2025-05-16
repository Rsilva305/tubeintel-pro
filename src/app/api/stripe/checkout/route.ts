import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';
import { PRODUCTS } from '@/utils/stripe';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { priceId, planType } = await req.json();
    
    // Debug info
    console.log('Checkout request received:', { priceId, planType });
    console.log('Server Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Using product ID:', planType === 'pro' ? PRODUCTS.PRO.id : PRODUCTS.PRO_PLUS.id);
    
    // Validate the request
    if (!priceId || !planType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    if (!(planType === 'pro' || planType === 'pro-plus')) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    const stripe = getServerStripe();
    console.log('Stripe client initialized:', !!stripe);
    
    // Let's directly create a stripe instance to ensure we're not affected by caching issues
    const Stripe = require('stripe');
    const directStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
    console.log('Direct Stripe client initialized:', !!directStripe);
    
    if (!directStripe) {
      console.log('Stripe not configured, returning demo success URL');
      // For development/demo purposes, just return a success URL
      return NextResponse.json({
        success: true,
        url: `/subscription/success?session_id=demo_session_${Date.now()}`
      });
    }

    // Get the user's session to identify them
    const headersList = headers();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Default email and user ID for testing without authentication
    let email = 'test@example.com';
    let userId = `test_user_${Date.now()}`;
    
    if (session && session.user) {
      // If authenticated, use real user info
      email = session.user.email || email;
      userId = session.user.id;
      console.log('User authenticated:', { email, userId: userId.substring(0, 8) + '...' });
    } else {
      console.log('User not authenticated, using test credentials');
    }

    // Get the correct price ID based on the plan type
    const activePriceId = planType === 'pro' 
      ? PRODUCTS.PRO.priceId 
      : PRODUCTS.PRO_PLUS.priceId;
    
    console.log('Active price ID:', activePriceId);

    try {
      // Create a new checkout session with Stripe
      console.log('Creating Stripe checkout session...');
      const checkoutSession = await directStripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price: activePriceId, // Use the price ID from our configuration
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription?canceled=true`,
        metadata: {
          userId,
          planType,
        },
      });
      
      console.log('Checkout session created:', { id: checkoutSession.id, url: checkoutSession.url });

      // Return the checkout URL
      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
      // For testing purposes, return a demo URL if there's an error with Stripe
      if (!session || !session.user) {
        console.log('User not authenticated, returning demo checkout session for testing');
        return NextResponse.json({
          url: `/subscription/success?session_id=demo_session_${Date.now()}`
        });
      }
      return NextResponse.json(
        { error: 'Stripe checkout session creation failed' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 