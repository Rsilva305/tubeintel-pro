import { NextRequest, NextResponse } from 'next/server';
import { stripe, getServerStripe } from '@/utils/stripe';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature') || '';
    
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    // Get stripe instance or return error if not available
    const stripeInstance = getServerStripe();
    if (!stripeInstance) {
      console.error('Stripe is not properly configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    
    // Verify the webhook signature
    let event;
    try {
      event = stripeInstance.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
    
    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract metadata from the session
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        
        if (userId && planType) {
          // Store subscription data in your database
          const supabase = createClient();
          
          // Check if customer exists
          let customerId = session.customer;
          
          // Update user's subscription in database
          const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: session.subscription,
              plan_type: planType,
              status: 'active',
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now as placeholder
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error updating subscription:', error);
            // We don't want to return an error status to Stripe
            // as this would cause them to retry the webhook
          }
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // Handle successful recurring payment
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        
        if (subscriptionId) {
          const supabase = createClient();
          
          // Get subscription details from Stripe
          const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId as string);
          
          // Find user by customer ID
          const { data: userData, error: userError } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();
            
          if (userError || !userData) {
            console.error('Error finding user for customer:', customerId, userError);
            break;
          }
          
          // Update subscription period end date
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              status: subscription.status,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);
            
          if (error) {
            console.error('Error updating subscription period:', error);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get user by customer ID
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userError || !userData) {
          console.error('Error finding user for customer:', customerId, userError);
          break;
        }
        
        // Update subscription status
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.user_id);
          
        if (error) {
          console.error('Error updating subscription status:', error);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get user by customer ID
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userError || !userData) {
          console.error('Error finding user for customer:', customerId, userError);
          break;
        }
        
        // Update subscription status to cancelled
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.user_id);
          
        if (error) {
          console.error('Error updating subscription cancellation:', error);
        }
        break;
      }
    }
    
    // Return a successful response to Stripe
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 