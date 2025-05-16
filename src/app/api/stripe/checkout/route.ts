import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';
import { PRODUCTS } from '@/utils/stripe';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { priceId, planType } = await req.json();
    
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
    if (!stripe) {
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
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user's email for the checkout
    const { email, id: userId } = session.user;

    try {
      // Create a new checkout session with Stripe
      const checkoutSession = await stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price: priceId,
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

      // Return the checkout URL
      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError);
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