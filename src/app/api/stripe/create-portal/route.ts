import { NextRequest, NextResponse } from 'next/server';
import { getServerStripe } from '@/utils/stripe';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user (standard way)
    const supabase = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    let userId = session?.user?.id || null;

    // Fallback: Try to extract user directly from cookie if Supabase session fails
    if (!userId) {
      const cookieStore = cookies();
      const authCookie = cookieStore.get('sb-auth-token');
      if (authCookie) {
        try {
          const authData = JSON.parse(authCookie.value);
          if (authData && authData.user) {
            userId = authData.user.id;
            console.log('User extracted directly from cookie for Stripe portal');
          }
        } catch (parseError) {
          console.error('Failed to parse auth cookie:', parseError);
        }
      }
    }

    // If user is still not found, redirect to login
    if (!userId) {
      const origin =
        req.headers.get('origin') ||
        (req.nextUrl && req.nextUrl.origin) ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000';
      return NextResponse.redirect(`${origin}/login?redirectTo=/dashboard`);
    }

    // Debug: Log the userId being used
    console.log('Stripe portal: userId:', userId);

    // Debug: Log the Supabase URL in use
    console.log('Supabase URL in use:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Use admin client for subscription lookup to bypass RLS
    const adminClient = createAdminClient();
    const { data: sub, error: subError } = await adminClient
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    // Debug: Log the result of the subscription query
    console.log('Stripe portal: subscription query result:', sub, 'Error:', subError);

    if (subError || !sub || !sub.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription or Stripe customer found.' }, { status: 404 });
    }

    // Create a Stripe billing portal session
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    // Determine the correct origin for the return_url
    const origin =
      req.headers.get('origin') ||
      (req.nextUrl && req.nextUrl.origin) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    // Redirect the user to the Stripe portal
    return NextResponse.redirect(portalSession.url);
  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 